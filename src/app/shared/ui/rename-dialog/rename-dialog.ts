import { ChangeDetectionStrategy, Component, ElementRef, effect, model, input, output, signal, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideX, lucideLoader2 } from '@ng-icons/lucide';

@Component({
  selector: 'kubo-rename-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({ lucidePencil, lucideX, lucideLoader2 })
  ],
  templateUrl: './rename-dialog.html'
})
export class RenameDialog {
  readonly open = model(false);
  readonly initialName = input<string>('');
  readonly loading = input<boolean>(false);
  readonly confirm = output<string>();

  protected readonly newName = signal('');
  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.newName.set(this.initialName());
        setTimeout(() => {
          const input = this.inputRef()?.nativeElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      }
    });
  }

  protected onInput(event: Event): void {
    this.newName.set((event.target as HTMLInputElement).value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    const name = this.newName().trim();
    if (!name || name === this.initialName()) {
      this.close();
      return;
    }
    this.confirm.emit(name);
  }
}
