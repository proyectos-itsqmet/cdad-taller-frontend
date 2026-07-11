import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideImage,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

import { FileApiService } from '../../../core/api/file-api.service';
import { FileItem } from '../../../core/models/models';
import {
  fileKind,
  formatBytes,
  friendlyType,
  relativeTime,
} from '../../../core/util/format';
import { FileIcon } from '../file-icon/file-icon';

/**
 * kubo-details-pane — right-side slide-in drawer showing metadata for a
 * single selected file.
 *
 * Usage:
 *   <kubo-details-pane [file]="selected()" [(open)]="detailsOpen" (deleted)="..." />
 *
 * The backend has no owner/sharing-list/folder-ancestry endpoints, so this
 * pane only shows metadata it can actually back with real API calls:
 * download (pre-signed URL) and delete. Deletion is delegated to the parent
 * via the `deleted` output — this component never reloads the listing
 * itself, since the parent (`Files`) owns the `httpResource`.
 *
 * The drawer is always in the DOM (translated off-screen when closed) so the
 * slide transition works. Browser-only concerns (ESC key, focus) are guarded
 * via afterNextRender / afterRenderEffect, which never run during SSR.
 */
@Component({
  selector: 'kubo-details-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, FileIcon],
  providers: [
    provideIcons({ lucideX, lucideDownload, lucideTrash2, lucideImage }),
  ],
  templateUrl: './details-pane.html',
})
export class DetailsPane {
  private readonly fileApi = inject(FileApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** File whose details are shown. `null` renders an empty prompt. */
  readonly file = input<FileItem | null>(null);
  /** Whether the drawer is visible. Two-way bindable via `[(open)]`. */
  readonly open = model<boolean>(false);
  /** Emitted after the file was deleted, so the parent can reload/clear selection. */
  readonly deleted = output<FileItem>();

  /** Pure formatters surfaced for the template. */
  protected readonly friendlyType = friendlyType;
  protected readonly formatBytes = formatBytes;
  protected readonly relativeTime = relativeTime;

  /** Static — the backend has no folder-ancestry endpoint to rebuild a real path. */
  protected readonly locationLabel = 'Mi unidad';

  protected readonly deleting = signal(false);

  private readonly closeBtn =
    viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  /** True when the current file is an image (drives the preview block). */
  protected readonly isImage = computed(() => {
    const f = this.file();
    return !!f && fileKind(f.mimeType) === 'image';
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

  /** Fetches a pre-signed download URL and triggers a browser download. */
  protected async download(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const f = this.file();
    if (!f) return;

    const url = await this.fileApi.getDownloadUrl(f.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.originalName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /** Deletes the file, then lets the parent reload/clear selection. */
  protected async remove(): Promise<void> {
    const f = this.file();
    if (!f || this.deleting()) return;

    this.deleting.set(true);
    try {
      await this.fileApi.remove(f.id);
      this.deleted.emit(f);
      this.close();
    } finally {
      this.deleting.set(false);
    }
  }

  protected close(): void {
    this.open.set(false);
  }
}
