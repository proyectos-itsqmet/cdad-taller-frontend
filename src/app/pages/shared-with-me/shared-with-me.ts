import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideShare2 } from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { FileItem, Permission } from '../../core/models/models';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';

/**
 * "Compartido conmigo" — files other users shared WITH the current user.
 * Each card surfaces the OWNER (avatar + name) and the permission badge so the
 * user can immediately tell these apart from their own files. Clicking a card
 * opens the shared details drawer; "Abrir ubicacion" links to the file's folder.
 */
@Component({
  selector: 'kubo-shared-with-me',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    FileIcon,
    UserAvatar,
    EmptyState,
    DetailsPane,
  ],
  providers: [provideIcons({ lucideShare2, lucideFolderOpen })],
  templateUrl: './shared-with-me.html',
})
export class SharedWithMe {
  private readonly ds = inject(DataService);

  /** Rows of { file, share, owner }, newest share first. */
  protected readonly rows = computed(() => this.ds.sharedWithMe());

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

  /** Human label for a share permission (never the raw enum). */
  protected permLabel(p: Permission): string {
    return p === 'WRITE' ? 'Puede editar' : 'Puede ver';
  }

  /** Full badge class string; color reinforces the text, never stands alone. */
  protected permBadgeClass(p: Permission): string {
    const base = 'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ';
    return (
      base +
      (p === 'WRITE'
        ? 'bg-brand/10 text-brand'
        : 'bg-surface-muted text-muted-foreground')
    );
  }
}
