import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideStar, lucideFolder } from '@ng-icons/lucide';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { FileService } from '../../core/files/file.service';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';

@Component({
  selector: 'kubo-starred',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, FileIcon, EmptyState, DetailsPane],
  providers: [provideIcons({ lucideStar, lucideFolderOpen, lucideFolder })],
  templateUrl: './starred.html',
})
export class Starred {
  private readonly fileService = inject(FileService);

  protected readonly starredQuery = injectQuery(() => ({
    queryKey: ['starred-files'],
    queryFn: () => lastValueFrom(this.fileService.getFiles(null, true)),
  }));

  protected readonly currentFiles = computed(() => this.starredQuery.data()?.files || []);
  protected readonly currentFolders = computed(() => this.starredQuery.data()?.folders || []);

  protected readonly selectedFile = signal<any>(null);
  protected readonly detailsOpen = signal(false);

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
      sharedAt: file.sharedAt ? file.sharedAt.toString() : undefined,
    };
    this.selectedFile.set(fileItem);
    this.detailsOpen.set(true);
  }
}
