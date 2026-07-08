import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
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
} from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { relativeTime } from '../../core/util/format';
import { ActivityEvent } from '../../core/models/models';
import { StorageMeter } from '../../shared/ui/storage-meter/storage-meter';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

/** Icon + tint per activity kind (dynamic names must all be registered). */
const ACTIVITY_ICON: Record<ActivityEvent['kind'], string> = {
  shared: 'lucideShare2',
  modified: 'lucidePencil',
  created: 'lucidePlus',
};
const ACTIVITY_TINT: Record<ActivityEvent['kind'], string> = {
  shared: 'bg-brand/10 text-brand',
  modified: 'bg-blue-500/10 text-blue-500',
  created: 'bg-success/10 text-success',
};
const ACTIVITY_VERB: Record<ActivityEvent['kind'], string> = {
  shared: 'compartió',
  modified: 'modificó',
  created: 'creó',
};

/**
 * Home — the KuboDrive dashboard/control panel at /home. Renders INSIDE the
 * AppShell outlet (content only). Greeting, quick stats, folder shortcuts,
 * a recent-files preview and a compact activity timeline. Fully read-only.
 */
@Component({
  selector: 'kubo-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, StorageMeter, FileIcon, EmptyState],
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
    }),
  ],
  templateUrl: './home.html',
})
export class Home {
  private readonly data = inject(DataService);

  protected readonly currentUser = this.data.currentUser;

  /** First token of the current user's name for the greeting. */
  protected readonly firstName = computed(
    () => this.data.currentUser().name.split(' ')[0],
  );

  /** The three headline metrics, each linking to its section. */
  protected readonly stats = computed(() => [
    {
      label: 'Archivos totales',
      value: this.data.files().length,
      icon: 'lucideFile',
      link: '/archivos',
      hint: 'En tu unidad',
    },
    {
      label: 'Compartidos conmigo',
      value: this.data.sharedWithMe().length,
      icon: 'lucideShare2',
      link: '/compartidos',
      hint: 'De otras personas',
    },
    {
      label: 'Destacados',
      value: this.data.starredFiles().length,
      icon: 'lucideStar',
      link: '/destacados',
      hint: 'Marcados con estrella',
    },
  ]);

  /** Root folders with a friendly item-count label. */
  protected readonly rootFolders = computed(() =>
    this.data.childFolders(null).map((folder) => {
      const count =
        this.data.childFolders(folder.id).length +
        this.data.filesInFolder(folder.id).length;
      return {
        folder,
        countLabel: count === 1 ? '1 elemento' : `${count} elementos`,
      };
    }),
  );

  /** Eight most-recent files with a precomputed relative timestamp. */
  protected readonly recent = computed(() =>
    this.data.recentFiles(8).map((file) => ({
      file,
      time: relativeTime(file.modifiedAt),
    })),
  );

  /** First five activity events, resolved to a display-ready view model. */
  protected readonly activity = computed(() => {
    const fileMap = new Map(this.data.files().map((f) => [f.id, f]));
    return this.data.activityFeed().slice(0, 5).map((ev) => {
      const actor = this.data.userById(ev.actorUserId);
      const file = ev.fileId ? fileMap.get(ev.fileId) : undefined;
      return {
        id: ev.id,
        icon: ACTIVITY_ICON[ev.kind],
        badgeClass:
          'flex size-9 shrink-0 items-center justify-center rounded-lg ' +
          ACTIVITY_TINT[ev.kind],
        actorName: actor?.name ?? 'Alguien',
        verb: ACTIVITY_VERB[ev.kind],
        fileName: file?.originalName ?? 'un archivo',
        time: relativeTime(ev.at),
      };
    });
  });
}
