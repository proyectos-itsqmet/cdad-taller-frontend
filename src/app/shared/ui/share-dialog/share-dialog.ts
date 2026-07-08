import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideLink,
  lucideMail,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';

import { DataService } from '../../../core/data/data.service';
import { FileItem, FileShare, Permission, User } from '../../../core/models/models';
import { UserAvatar } from '../user-avatar/user-avatar';

/** Tooltip shown on every action disabled in this read-only mockup. */
const MOCK_TOOLTIP = 'Disponible en la version completa';

/** Row shape returned by DataService.sharesForFile(). */
type ShareRow = { share: FileShare; user: User };

/**
 * kubo-share-dialog — centered modal for managing who a file is shared with.
 *
 * Usage:
 *   <kubo-share-dialog [file]="selected()" [(open)]="shareOpen" />
 *
 * Fully illustrative: the invite input and per-person controls render but do
 * not mutate anything. "Copiar enlace" only flashes visual feedback. ESC,
 * backdrop click and "Listo" all close. Focus is trapped inside the dialog and
 * restored to the trigger on close. All DOM access is browser-guarded via
 * afterRenderEffect, which never runs during SSR.
 */
@Component({
  selector: 'kubo-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, UserAvatar],
  providers: [
    provideIcons({ lucideX, lucideLink, lucideCheck, lucideMail, lucideUsers }),
  ],
  templateUrl: './share-dialog.html',
})
export class ShareDialog {
  private readonly data = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);

  /** File being shared. `null` collapses the title to a generic label. */
  readonly file = input<FileItem | null>(null);
  /** Whether the modal is visible. Two-way bindable via `[(open)]`. */
  readonly open = model<boolean>(false);

  /** Mock tooltip exposed to the template. */
  protected readonly mockTooltip = MOCK_TOOLTIP;
  /** Stable id linking the dialog to its title (single-instance mockup). */
  protected readonly titleId = 'kubo-share-dialog-title';

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly closeBtn =
    viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  /** Dialog title: `Compartir "nombre"`, or a fallback when no file is set. */
  protected readonly titleText = computed(() => {
    const f = this.file();
    return f ? `Compartir "${f.originalName}"` : 'Compartir';
  });

  /** People this file is already shared with. */
  protected readonly shares = computed<ShareRow[]>(() => {
    const f = this.file();
    return f ? this.data.sharesForFile(f.id) : [];
  });

  /** Transient "Copiado" feedback for the copy-link button. */
  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  private lastFocused: HTMLElement | null = null;
  private wasOpen = false;
  private prevOverflow = '';

  constructor() {
    // Focus management + body scroll-lock, browser-only via afterRenderEffect.
    afterRenderEffect(() => {
      const open = this.open();
      if (open && !this.wasOpen) {
        this.prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.closeBtn()?.nativeElement.focus();
      } else if (!open && this.wasOpen) {
        document.body.style.overflow = this.prevOverflow;
        this.lastFocused?.focus?.();
        this.lastFocused = null;
      }
      this.wasOpen = open;
    });

    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  /** Human label for a share permission. */
  protected permLabel(p: Permission): string {
    return p === 'WRITE' ? 'Puede editar' : 'Puede ver';
  }

  /** Name of whoever granted a given share. */
  protected sharedBy(row: ShareRow): string {
    return this.data.userById(row.share.sharedByUserId)?.name ?? 'Desconocido';
  }

  /** Handle ESC (close) and Tab (focus trap) from inside the dialog. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Keep Tab cycling within the dialog's focusable elements. */
  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialog()?.nativeElement;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Visual-only clipboard feedback — no real navigator.clipboard call. */
  protected copyLink(): void {
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  protected close(): void {
    this.open.set(false);
  }
}
