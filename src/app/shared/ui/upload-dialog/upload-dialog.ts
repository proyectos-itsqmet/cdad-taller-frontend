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
  readonly confirm = output<{ files: File[]; starred: boolean }>();

  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly isStarred = signal(false);
  protected readonly formatBytes = formatBytes;

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  protected toggleStar(): void {
    this.isStarred.update(s => !s);
  }

  protected close(): void {
    this.open.set(false);
    setTimeout(() => {
      this.selectedFiles.set([]);
      this.isStarred.set(false);
    }, 200);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const files = this.selectedFiles();
    if (files.length === 0) return;
    this.confirm.emit({ files, starred: this.isStarred() });
    this.close();
  }
}

