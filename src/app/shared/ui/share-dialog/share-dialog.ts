import {
  ChangeDetectionStrategy,
  Component,
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
import { lucideCheck, lucideMail, lucideX } from '@ng-icons/lucide';

import { FileApiService } from '../../../core/api/file-api.service';
import { FileItem } from '../../../core/models/models';

/**
 * kubo-share-dialog — centered modal to invite another user (by email) to
 * view a file.
 *
 * Usage:
 *   <kubo-share-dialog [file]="selected()" [(open)]="shareOpen" />
 *
 * The backend only exposes a create-share (read-only) endpoint — there is no
 * list-shares, revoke, or permission-level API, so this dialog is a single
 * email input + submit, with an inline success/error message. ESC, backdrop
 * click and "Cerrar" all close. Focus is trapped inside the dialog and
 * restored to the trigger on close. All DOM access is browser-guarded via
 * afterRenderEffect, which never runs during SSR.
 */
@Component({
  selector: 'kubo-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideX, lucideCheck, lucideMail })],
  templateUrl: './share-dialog.html',
})
export class ShareDialog {
  private readonly fileApi = inject(FileApiService);

  /** File being shared. `null` collapses the title to a generic label. */
  readonly file = input<FileItem | null>(null);
  /** Whether the modal is visible. Two-way bindable via `[(open)]`. */
  readonly open = model<boolean>(false);

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

  /** Email being invited. */
  protected readonly email = signal('');
  /** In-flight submit state. */
  protected readonly submitting = signal(false);
  /** Inline feedback shown after a submit attempt. */
  protected readonly feedback = signal<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  );

  private lastFocused: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    // Focus management, browser-only via afterRenderEffect.
    afterRenderEffect(() => {
      const open = this.open();
      if (open && !this.wasOpen) {
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.closeBtn()?.nativeElement.focus();
      } else if (!open && this.wasOpen) {
        this.lastFocused?.focus?.();
        this.lastFocused = null;
        this.email.set('');
        this.feedback.set(null);
      }
      this.wasOpen = open;
    });
  }

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  /** Submits the invite to the backend's create-share (read-only) endpoint. */
  protected async submit(): Promise<void> {
    const file = this.file();
    const email = this.email().trim();
    if (!file || !email || this.submitting()) return;

    this.submitting.set(true);
    this.feedback.set(null);
    try {
      await this.fileApi.share(file.id, email);
      this.feedback.set({ kind: 'success', message: `Invitación enviada a ${email}.` });
      this.email.set('');
    } catch {
      this.feedback.set({
        kind: 'error',
        message: 'No se pudo compartir el archivo. Intenta nuevamente.',
      });
    } finally {
      this.submitting.set(false);
    }
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

  /** Tailwind classes for the inline feedback message, by kind. */
  protected feedbackClass(kind: 'success' | 'error'): string {
    return kind === 'success'
      ? 'bg-success/10 text-success'
      : 'bg-destructive/10 text-destructive';
  }

  protected close(): void {
    this.open.set(false);
  }
}
