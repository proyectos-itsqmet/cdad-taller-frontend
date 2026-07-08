import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFile,
  lucideFileArchive,
  lucideFileCode,
  lucideFileSpreadsheet,
  lucideFileText,
  lucideFolder,
  lucideImage,
  lucideMusic,
  lucidePresentation,
  lucideVideo,
} from '@ng-icons/lucide';
import { fileKind } from '../../../core/util/format';

type FileKind = ReturnType<typeof fileKind>;

const KIND_ICON: Record<FileKind, string> = {
  image: 'lucideImage',
  video: 'lucideVideo',
  audio: 'lucideMusic',
  pdf: 'lucideFileText',
  doc: 'lucideFileText',
  sheet: 'lucideFileSpreadsheet',
  slide: 'lucidePresentation',
  archive: 'lucideFileArchive',
  code: 'lucideFileCode',
  text: 'lucideFileText',
  folder: 'lucideFolder',
  other: 'lucideFile',
};

const KIND_COLOR: Record<FileKind, string> = {
  image: 'text-cyan-500',
  video: 'text-purple-500',
  audio: 'text-pink-500',
  pdf: 'text-red-500',
  doc: 'text-blue-500',
  sheet: 'text-green-600',
  slide: 'text-orange-500',
  archive: 'text-amber-500',
  code: 'text-slate-500',
  text: 'text-slate-400',
  folder: 'text-brand',
  other: 'text-muted-foreground',
};

/**
 * kubo-file-icon — colored file-type glyph.
 * Provide either `mime` or `kind`; `kind` wins when both are set.
 */
@Component({
  selector: 'kubo-file-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideImage,
      lucideVideo,
      lucideMusic,
      lucideFileText,
      lucideFileSpreadsheet,
      lucidePresentation,
      lucideFileArchive,
      lucideFileCode,
      lucideFolder,
      lucideFile,
    }),
  ],
  host: { class: 'inline-flex items-center justify-center' },
  template: `<ng-icon [name]="icon()" [size]="size()" [class]="colorClass()" aria-hidden="true" />`,
})
export class FileIcon {
  /** MIME type used to derive the kind when `kind` is not provided. */
  readonly mime = input<string>();
  /** Explicit file kind; overrides `mime`. */
  readonly kind = input<FileKind>();
  /** CSS font-size for the glyph (e.g. "1.5rem", "24px"). */
  readonly size = input<string>('1.5rem');

  protected readonly resolvedKind = computed<FileKind>(() => this.kind() ?? fileKind(this.mime() ?? ''));
  protected readonly icon = computed(() => KIND_ICON[this.resolvedKind()]);
  protected readonly colorClass = computed(() => KIND_COLOR[this.resolvedKind()]);
}
