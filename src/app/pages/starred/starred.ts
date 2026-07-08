import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideStar } from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { FileItem } from '../../core/models/models';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';

/**
 * "Destacados" — the current user's starred files. Each card carries a star
 * indicator (icon + label, so color is never the only signal). Clicking a card
 * opens the shared details drawer; "Abrir ubicacion" links to the folder.
 */
@Component({
  selector: 'kubo-starred',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, FileIcon, EmptyState, DetailsPane],
  providers: [provideIcons({ lucideStar, lucideFolderOpen })],
  templateUrl: './starred.html',
})
export class Starred {
  private readonly ds = inject(DataService);

  /** The current user's starred files, newest modification first. */
  protected readonly files = computed(() => this.ds.starredFiles());

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
