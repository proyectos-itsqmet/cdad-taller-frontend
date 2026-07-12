import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideImage,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

import { DataService } from '../../../core/data/data.service';
import { FileItem, Permission } from '../../../core/models/models';
import {
  fileKind,
  formatBytes,
  friendlyType,
  relativeTime,
} from '../../../core/util/format';
import { FileIcon } from '../file-icon/file-icon';
import { UserAvatar } from '../user-avatar/user-avatar';

/** Tooltip shown on every action disabled in this read-only mockup. */
const MOCK_TOOLTIP = 'Disponible en la version completa';

/**
 * kubo-details-pane — right-side slide-in drawer showing metadata and sharing
 * info for a single selected file.
 *
 * Usage:
 *   <kubo-details-pane [file]="selected()" [(open)]="detailsOpen" />
 *
 * The drawer is always in the DOM (translated off-screen when closed) so the
 * slide transition works. Browser-only concerns (ESC key, focus) are guarded
 * via afterNextRender / afterRenderEffect, which never run during SSR.
 */
@Component({
  selector: 'kubo-details-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, FileIcon, UserAvatar],
  providers: [
    provideIcons({ lucideX, lucideDownload, lucideTrash2, lucideImage }),
  ],
  templateUrl: './details-pane.html',
})
export class DetailsPane {
  private readonly data = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);

  /** File whose details are shown. `null` renders an empty prompt. */
  readonly file = input<FileItem | null>(null);
  /** Whether the drawer is visible. Two-way bindable via `[(open)]`. */
  readonly open = model<boolean>(false);
  /** Request to download this file. */
  readonly download = output<void>();
  /** Request to delete this file. */
  readonly delete = output<void>();

  /** Mock tooltip exposed to the template. */
  protected readonly mockTooltip = MOCK_TOOLTIP;

  /** Pure formatters surfaced for the template. */
  protected readonly friendlyType = friendlyType;
  protected readonly formatBytes = formatBytes;
  protected readonly relativeTime = relativeTime;

  private readonly closeBtn =
    viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  /** True when the current file is an image (drives the preview block). */
  protected readonly isImage = computed(() => {
    const f = this.file();
    return !!f && fileKind(f.mimeType) === 'image';
  });

  /** Owner of the current file. */
  protected readonly owner = computed(() => {
    const f = this.file();
    return f ? this.data.userById(f.userId) : undefined;
  });

  /** "Mi unidad / A / B" path derived from the file's folder chain. */
  protected readonly locationPath = computed(() => {
    const f = this.file();
    if (!f) return 'Mi unidad';
    const chain = this.data.breadcrumb(f.folderId);
    return ['Mi unidad', ...chain.map((c) => c.name)].join(' / ');
  });

  /** Recipients this file is shared with. */
  protected readonly shares = computed(() => {
    const f = this.file();
    return f ? this.data.sharesForFile(f.id) : [];
  });

  /** Remembers what had focus before the drawer opened. */
  private lastFocused: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    // Global ESC-to-close, attached only in the browser and cleaned up on destroy.
    afterNextRender(() => {
      const handler = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.open()) {
          this.close();
        }
      };
      document.addEventListener('keydown', handler);
      this.destroyRef.onDestroy(() =>
        document.removeEventListener('keydown', handler),
      );
    });

    // Move focus into the drawer on open and restore it on close.
    afterRenderEffect(() => {
      const open = this.open();
      if (open && !this.wasOpen) {
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.closeBtn()?.nativeElement.focus();
      } else if (!open && this.wasOpen) {
        this.lastFocused?.focus?.();
        this.lastFocused = null;
      }
      this.wasOpen = open;
    });
  }

  /** Human label for a share permission. */
  protected permLabel(p: Permission): string {
    return p === 'WRITE' ? 'Puede editar' : 'Puede ver';
  }

  /** Badge classes per permission (color reinforces the text label, never alone). */
  protected permBadgeClass(p: Permission): string {
    return p === 'WRITE'
      ? 'bg-brand/10 text-brand'
      : 'bg-surface-muted text-muted-foreground';
  }

  protected close(): void {
    this.open.set(false);
  }
}
