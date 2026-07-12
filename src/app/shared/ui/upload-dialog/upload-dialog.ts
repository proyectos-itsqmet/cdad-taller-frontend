import { ChangeDetectionStrategy, Component, model, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStar, lucideUploadCloud, lucideX } from '@ng-icons/lucide';
import { formatBytes } from '../../../core/util/format';

@Component({
  selector: 'kubo-upload-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({ lucideStar, lucideX, lucideUploadCloud })
  ],
  templateUrl: './upload-dialog.html'
})
export class UploadDialog {
  readonly open = model(false);
  readonly confirm = output<{ file: File; starred: boolean }>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isStarred = signal(false);
  protected readonly formatBytes = formatBytes;

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  protected toggleStar(): void {
    this.isStarred.update(s => !s);
  }

  protected close(): void {
    this.open.set(false);
    setTimeout(() => {
      this.selectedFile.set(null);
      this.isStarred.set(false);
    }, 200);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const file = this.selectedFile();
    if (!file) return;
    this.confirm.emit({ file, starred: this.isStarred() });
    this.close();
  }
}
