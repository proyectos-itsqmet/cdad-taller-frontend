import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideHouse,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';
import { DataService } from '../../../core/data/data.service';
import { Folder } from '../../../core/models/models';
import { FileIcon } from '../../../shared/ui/file-icon/file-icon';

/** A single flattened row of the (expandable) folder tree. */
interface TreeRow {
  folder: Folder;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

/**
 * FoldersSettings — "Carpetas". A read-only, expandable overview of the folder
 * tree plus inert (mock) management controls: a default-home select and
 * Crear / Renombrar / Eliminar buttons, all disabled with a tooltip.
 */
@Component({
  selector: 'kubo-settings-folders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, FileIcon],
  providers: [
    provideIcons({
      lucideChevronRight,
      lucideChevronDown,
      lucidePlus,
      lucidePencil,
      lucideTrash2,
      lucideHouse,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './folders.html',
})
export class FoldersSettings {
  private readonly data = inject(DataService);

  /** Tooltip shown on every disabled mock action. */
  protected readonly mockTitle = 'Disponible en la versión completa';

  /** Root folders — used to populate the (inert) default-home select. */
  protected readonly rootFolders = computed(() => this.data.childFolders(null));

  /** Ids of the currently-expanded folders. */
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set<string>());

  /** Depth-first flattening of the tree, respecting the expanded set. */
  protected readonly rows = computed<TreeRow[]>(() => {
    const expanded = this.expandedIds();
    const out: TreeRow[] = [];

    const walk = (parentId: string | null, depth: number): void => {
      for (const folder of this.data.childFolders(parentId)) {
        const hasChildren = this.data.childFolders(folder.id).length > 0;
        const isExpanded = expanded.has(folder.id);
        out.push({ folder, depth, hasChildren, expanded: isExpanded });
        if (hasChildren && isExpanded) {
          walk(folder.id, depth + 1);
        }
      }
    };

    walk(null, 0);
    return out;
  });

  protected toggle(folderId: string): void {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  /** Left padding (rem) for a row at the given depth, leaving room for the caret. */
  protected indent(depth: number): number {
    return depth * 1.5;
  }
}
