import { ChangeDetectionStrategy, Component, ElementRef, effect, model, output, signal, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolder, lucideStar, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'kubo-folder-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({ lucideFolder, lucideStar, lucideX })
  ],
  templateUrl: './folder-dialog.html'
})
export class FolderDialog {
  /** If the dialog is currently open. */
  readonly open = model(false);
  /** Emits { name, starred } on submit. */
  readonly confirm = output<{ name: string; starred: boolean }>();

  protected readonly folderName = signal('');
  protected readonly isStarred = signal(false);
  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.folderName.set('');
        this.isStarred.set(false);
        // Delay focus slightly so the DOM has time to render the modal
        setTimeout(() => this.inputRef()?.nativeElement.focus(), 50);
      }
    });
  }

  protected onInput(event: Event): void {
    this.folderName.set((event.target as HTMLInputElement).value);
  }

  protected toggleStar(): void {
    console.log('here');
    
    this.isStarred.update(s => !s);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const name = this.folderName().trim();
    if (!name) return;
    this.confirm.emit({ name, starred: this.isStarred() });
    this.open.set(false);
  }
}
