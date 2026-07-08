import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClock, lucideFolderOpen } from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { FileItem } from '../../core/models/models';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';

/**
 * "Recientes" — the current user's files sorted by modifiedAt desc (capped at
 * 30). Each card shows the humanized relative modification time. Clicking a
 * card opens the shared details drawer; "Abrir ubicacion" links to the folder.
 */
@Component({
  selector: 'kubo-recent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, FileIcon, EmptyState, DetailsPane],
  providers: [provideIcons({ lucideClock, lucideFolderOpen })],
  templateUrl: './recent.html',
})
export class Recent {
  private readonly ds = inject(DataService);

  /** Up to 30 of the current user's files, newest modification first. */
  protected readonly files = computed(() => this.ds.recentFiles(30));

  /** Currently selected file for the details drawer. */
  protected readonly selectedFile = signal<FileItem | null>(null);
  /** Two-way bound visibility for the details drawer. */
  protected readonly detailsOpen = signal(false);

  /** Pure formatters surfaced for the template. */
  protected readonly friendlyType = friendlyType;
  protected readonly formatBytes = formatBytes;
  protected readonly relativeTime = relativeTime;

  protected openDetails(file: FileItem): void {
    this.selectedFile.set(file);
    this.detailsOpen.set(true);
  }

  /** RouterLink target for the file's containing folder (root when null). */
  protected locationLink(file: FileItem): unknown[] {
    return file.folderId ? ['/archivos', file.folderId] : ['/archivos'];
  }
}
