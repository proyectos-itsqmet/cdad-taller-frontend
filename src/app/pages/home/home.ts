import { ChangeDetectionStrategy, Component, computed, inject, HostListener, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import {
  lucideArrowRight,
  lucideChevronRight,
  lucideClock,
  lucideFile,
  lucideFolder,
  lucideFolderOpen,
  lucideHardDrive,
  lucidePencil,
  lucidePlus,
  lucideShare2,
  lucideStar,
  lucideUpload,
  lucideLoader2,
  lucideCheckCircle2,
  lucideX,
  lucideInbox
} from '@ng-icons/lucide';

import { AuthService } from '../../core/auth/auth.service';
import { FileService } from '../../core/files/file.service';
import { relativeTime } from '../../core/util/format';
import { StorageMeter } from '../../shared/ui/storage-meter/storage-meter';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { UploadDialog } from '../../shared/ui/upload-dialog/upload-dialog';

@Component({
  selector: 'kubo-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, StorageMeter, FileIcon, EmptyState, JsonPipe, UploadDialog],
  providers: [
    provideIcons({
      lucideUpload,
      lucideFile,
      lucideShare2,
      lucideStar,
      lucideFolder,
      lucideFolderOpen,
      lucideHardDrive,
      lucideArrowRight,
      lucideChevronRight,
      lucideClock,
      lucidePencil,
      lucidePlus,
      lucideLoader2,
      lucideCheckCircle2,
      lucideX,
      lucideInbox
    }),
  ],
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly fileService = inject(FileService);
  private readonly queryClient = injectQueryClient();

  protected readonly uploadDialogOpen = signal(false);
  readonly uploadStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  protected readonly uploadFileName = signal('');
  protected readonly uploadProgress = signal(0);

  protected readonly loginResponse = this.auth.currentUser;

  protected readonly firstName = computed(
    () => this.loginResponse()?.firstName || 'Usuario',
  );

  protected readonly filesQuery = injectQuery(() => ({
    queryKey: ['home-files'],
    queryFn: () => lastValueFrom(this.fileService.getFiles(null))
  }));

  protected readonly historyQuery = injectQuery(() => ({
    queryKey: ['home-history'],
    queryFn: () => lastValueFrom(this.fileService.getHistory({ size: 5 }))
  }));

  protected readonly statsQuery = injectQuery(() => ({
    queryKey: ['stats'],
    queryFn: () => lastValueFrom(this.fileService.getStats())
  }));

  protected readonly stats = computed(() => [
    {
      label: 'Archivos totales',
      value: this.statsQuery.data()?.totalFiles || 0,
      icon: 'lucideFile',
      link: '/archivos',
      hint: 'En tu unidad',
    },
    {
      label: 'Compartidos conmigo',
      value: this.statsQuery.data()?.sharedFiles || 0,
      icon: 'lucideShare2',
      link: '/compartidos',
      hint: 'De otras personas',
    },
    {
      label: 'Destacados',
      value: this.statsQuery.data()?.starredItems || 0,
      icon: 'lucideStar',
      link: '/destacados',
      hint: 'Marcados con estrella',
    },
  ]);

  protected readonly rootFolders = computed(() =>
    (this.filesQuery.data()?.folders || []).slice(0, 3).map((folder) => {
      const n = folder.itemsCount || 0;
      return {
        folder,
        countLabel: n === 1 ? '1 elemento' : `${n} elementos`,
      };
    }),
  );

  protected readonly recent = computed(() => {
    const files = this.filesQuery.data()?.files || [];
    return files
      .slice()
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
      .slice(0, 5)
      .map((file) => ({
        file,
        time: relativeTime(file.createdAt as any),
      }));
  });

  protected readonly activity = computed(() => {
    const history = this.historyQuery.data()?.content || [];
    return history.map((ev) => {
      let icon = 'lucidePlus';
      let badgeClass = 'bg-success/10 text-success';
      let verb = 'realizó';

      if (ev.actionType === 'UPLOAD' || ev.actionType === 'CREATE') {
        icon = 'lucidePlus';
        badgeClass = 'bg-success/10 text-success';
        verb = ev.actionType === 'UPLOAD' ? 'subió' : 'creó';
      } else if (ev.actionType === 'SHARE') {
        icon = 'lucideShare2';
        badgeClass = 'bg-brand/10 text-brand';
        verb = 'compartió';
      } else if (ev.actionType === 'RENAME') {
        icon = 'lucidePencil';
        badgeClass = 'bg-blue-500/10 text-blue-500';
        verb = 'renombró';
      } else if (ev.actionType === 'DELETE' || ev.actionType === 'UNSHARE') {
        icon = 'lucideX';
        badgeClass = 'bg-red-500/10 text-red-500';
        verb = ev.actionType === 'DELETE' ? 'eliminó' : 'dejó de compartir';
      }

      return {
        id: ev.id,
        icon,
        badgeClass: 'flex size-9 shrink-0 items-center justify-center rounded-lg ' + badgeClass,
        actorName: 'Tú',
        verb,
        fileName: ev.itemName,
        time: relativeTime(ev.timestamp),
      };
    });
  });

  protected openUploadDialog(): void {
    this.uploadDialogOpen.set(true);
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.uploadStatus() === 'uploading') {
      event.preventDefault();
      event.returnValue = 'El archivo no se ha subido, si sales la carga se cancelará.';
    }
  }

  protected onFileUploaded(event: { file: File; starred: boolean }): void {
    const parentId = null;
    
    this.uploadFileName.set(event.file.name);
    this.uploadStatus.set('uploading');
    this.uploadProgress.set(0);
    
    const progressInterval = setInterval(() => {
      if (this.uploadProgress() < 90) {
        this.uploadProgress.update(p => Math.min(90, p + Math.floor(Math.random() * 15) + 5));
      }
    }, 250);

    this.fileService.uploadFile(event.file, parentId, event.starred).subscribe({
      next: (res) => {
        if (res.type === 'progress') {
          if (res.percent > this.uploadProgress() || res.percent === 100) {
            this.uploadProgress.set(res.percent);
          }
        } else {
          clearInterval(progressInterval);
          this.uploadProgress.set(100);
          this.uploadStatus.set('success');
          setTimeout(() => {
            if (this.uploadStatus() === 'success') this.uploadStatus.set('idle');
          }, 3000);
          
          // Invalidate queries to refresh the lists
          this.queryClient.invalidateQueries({ queryKey: ['home-files'] });
          this.queryClient.invalidateQueries({ queryKey: ['home-history'] });
          this.queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
      },
      error: () => {
        clearInterval(progressInterval);
        this.uploadStatus.set('error');
        setTimeout(() => {
          if (this.uploadStatus() === 'error') this.uploadStatus.set('idle');
        }, 3000);
      }
    });
  }
}
