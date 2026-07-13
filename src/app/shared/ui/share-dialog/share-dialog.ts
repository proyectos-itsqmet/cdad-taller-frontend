import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, model, output, signal, viewChild, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMail, lucideUsers, lucideX } from '@ng-icons/lucide';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'kubo-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({ lucideMail, lucideUsers, lucideX })
  ],
  templateUrl: './share-dialog.html'
})
export class ShareDialog {
  /** If the dialog is currently open. */
  readonly open = model(false);
  /** The name of the file or folder being shared. */
  readonly itemName = input<string>('');
  /** Determines if it's for sharing or revoking access. */
  readonly mode = input<'share' | 'revoke'>('share');
  /** External submitting state */
  readonly isSubmitting = input<boolean>(false);
  /** External error state */
  readonly error = input<string | null>(null);
  /** Emits the email to share with. */
  readonly confirm = output<{ email: string }>();

  protected readonly email = signal('');
  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  protected readonly isEmailValid = computed(() => {
    return EMAIL_RE.test(this.email().trim());
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.email.set('');
        setTimeout(() => this.inputRef()?.nativeElement.focus(), 50);
      }
    });
  }

  protected onInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.isEmailValid() || this.isSubmitting()) return;
    this.confirm.emit({ email: this.email().trim() });
  }
}
