import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideShare2, lucideFolder, lucideUserMinus, lucideCheckCircle2, lucideDownload } from '@ng-icons/lucide';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { FileService } from '../../core/files/file.service';
import { TransferService } from '../../core/services/transfer.service';
import { File, Folder } from '../../model/interfaces';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'kubo-shared-with-me',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    FileIcon,
    EmptyState,
    DetailsPane,
    ConfirmDialog,
  ],
  providers: [provideIcons({ lucideShare2, lucideFolderOpen, lucideFolder, lucideUserMinus, lucideCheckCircle2, lucideDownload })],
  templateUrl: './shared-with-me.html',
})
export class SharedWithMe {
  private readonly fileService = inject(FileService);
  private readonly transferService = inject(TransferService);

  readonly type = input<'conmigo' | 'por-mi'>('conmigo');

  protected readonly view = computed<'with-me' | 'by-me'>(() => 
    this.type() === 'por-mi' ? 'by-me' : 'with-me'
  );

  constructor() {
    effect(() => {
      // Re-run this effect whenever the view type changes.
      const currentView = this.view();
      // Reset the drawer without triggering other effects recursively.
      untracked(() => {
        this.detailsOpen.set(false);
        this.selectedFile.set(null);
      });
    });
  }

  protected readonly sharedWithMeQuery = injectQuery(() => ({
    queryKey: ['shared-with-me'],
    queryFn: () => lastValueFrom(this.fileService.getSharedWithMe()),
  }));

  protected readonly sharedByMeQuery = injectQuery(() => ({
    queryKey: ['shared-by-me'],
    queryFn: () => lastValueFrom(this.fileService.getSharedByMe()),
  }));

  protected readonly currentFiles = computed(() => {
    if (this.view() === 'with-me') {
      return this.sharedWithMeQuery.data()?.files || [];
    }
    return this.sharedByMeQuery.data()?.files || [];
  });

  protected readonly currentFolders = computed(() => {
    if (this.view() === 'with-me') {
      return this.sharedWithMeQuery.data()?.folders || [];
    }
    return this.sharedByMeQuery.data()?.folders || [];
  });

  protected readonly selectedFile = signal<any>(null);
  protected readonly detailsOpen = signal(false);

  // Revoke state
  protected readonly revokeConfirmOpen = signal(false);
  protected readonly revokeConfirmTitle = 'Revocar acceso';
  protected readonly revokeConfirmMessage = signal('');
  protected readonly isRevoking = signal(false);
  protected revokeItem: { id: string, email: string, type: 'file' | 'folder' } | null = null;
  
  protected readonly successModalOpen = signal(false);
  protected readonly successMessage = signal('');

  protected readonly downloadStatus = signal<'idle' | 'downloading' | 'success' | 'error'>('idle');
  protected readonly downloadFileName = signal('');
  protected readonly downloadProgress = signal(0);

  protected readonly friendlyType = friendlyType;
  protected readonly formatBytes = formatBytes;
  protected readonly relativeTime = relativeTime;

  protected openDetails(file: any): void {
    const fileItem = {
      id: file.id,
      folderId: file.folderId as string | null,
      userId: '',
      originalName: file.originalName,
      minioObjectId: '',
      size: file.sizeBytes,
      mimeType: file.mimeType,
      createdAt: (file.createdAt as any).toString(),
      modifiedAt: (file.createdAt as any).toString(),
      starred: file.starred,
      sharedByEmail: file.sharedByEmail,
      sharedByFirstName: file.sharedByFirstName,
      sharedByLastName: file.sharedByLastName,
      sharedWithEmail: file.sharedWithEmail,
      sharedWithFirstName: file.sharedWithFirstName,
      sharedWithLastName: file.sharedWithLastName,
      sharedAt: file.sharedAt ? file.sharedAt.toString() : undefined,
    };
    this.selectedFile.set(fileItem);
    this.detailsOpen.set(true);
  }

  protected getAvatarInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'U';
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'U';
  }

  protected promptRevokeFile(file: any): void {
    if (!file.sharedWithEmail) return;
    this.revokeItem = { id: file.id, email: file.sharedWithEmail, type: 'file' };
    this.revokeConfirmMessage.set(`¿Estás seguro de que deseas revocar el acceso a ${file.sharedWithEmail} para el archivo "${file.originalName}"?`);
    this.revokeConfirmOpen.set(true);
  }

  protected promptRevokeFolder(folder: any): void {
    if (!folder.sharedWithEmail) return; // Assuming folder has this property in API
    this.revokeItem = { id: folder.id, email: folder.sharedWithEmail, type: 'folder' };
    this.revokeConfirmMessage.set(`¿Estás seguro de que deseas revocar el acceso a ${folder.sharedWithEmail} para la carpeta "${folder.name}"?`);
    this.revokeConfirmOpen.set(true);
  }

  protected confirmRevoke(): void {
    if (!this.revokeItem) return;
    this.isRevoking.set(true);

    const revokeObs = this.revokeItem.type === 'file'
      ? this.fileService.unshareFile(this.revokeItem.id, this.revokeItem.email)
      : this.fileService.unshareFolder(this.revokeItem.id, this.revokeItem.email);

    revokeObs.subscribe({
      next: () => {
        this.isRevoking.set(false);
        this.revokeConfirmOpen.set(false);
        this.revokeItem = null;
        this.successMessage.set('Acceso revocado exitosamente');
        this.successModalOpen.set(true);
        this.sharedByMeQuery.refetch();
      },
      error: () => {
        this.isRevoking.set(false);
        alert('Error al revocar el acceso.');
      }
    });
  }

  protected downloadSelected(): void {
    const file = this.selectedFile();
    if (file) {
      this.downloadFile(file);
    }
  }

  protected downloadFile(file: any): void {
    this.transferService.downloadFile(file);
  }

}
