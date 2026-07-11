import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideEllipsisVertical,
  lucideInfo,
  lucidePencil,
  lucideShare2,
  lucideTrash2,
} from '@ng-icons/lucide';
import { FileItem } from '../../core/models/models';

/**
 * kubo-file-menu — trailing kebab with per-file actions.
 * "Ver detalles" and "Compartir" ask the parent to open the shared
 * details/share overlays; "Descargar", "Renombrar" and "Eliminar" emit
 * outputs the parent wires to the real API calls. Self-manages open/close
 * via browser-only host listeners (outside-click + Escape), so it is
 * SSR/zoneless-safe — no listeners are attached during prerender.
 */
@Component({
  selector: 'kubo-file-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideEllipsisVertical,
      lucideInfo,
      lucideShare2,
      lucideDownload,
      lucidePencil,
      lucideTrash2,
    }),
  ],
  host: {
    class: 'relative inline-block',
    '(document:click)': 'menuOpen.set(false)',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
  template: `
    <button
      type="button"
      class="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-haspopup="menu"
      [attr.aria-expanded]="menuOpen()"
      [attr.aria-label]="'Más acciones para ' + file().originalName"
      (click)="toggle($event)"
    >
      <ng-icon name="lucideEllipsisVertical" class="text-lg" aria-hidden="true" />
    </button>

    @if (menuOpen()) {
      <div
        class="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1.5 text-left shadow-lg"
        role="menu"
        [attr.aria-label]="'Acciones para ' + file().originalName"
      >
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="onDetails()"
        >
          <ng-icon name="lucideInfo" class="text-base text-muted-foreground" aria-hidden="true" />
          Ver detalles
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="onShare()"
        >
          <ng-icon name="lucideShare2" class="text-base text-muted-foreground" aria-hidden="true" />
          Compartir
        </button>

        <div class="my-1 h-px bg-border"></div>

        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="onDownload()"
        >
          <ng-icon name="lucideDownload" class="text-base text-muted-foreground" aria-hidden="true" />
          Descargar
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="onRename()"
        >
          <ng-icon name="lucidePencil" class="text-base text-muted-foreground" aria-hidden="true" />
          Renombrar
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-destructive transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="onDelete()"
        >
          <ng-icon name="lucideTrash2" class="text-base" aria-hidden="true" />
          Eliminar
        </button>
      </div>
    }
  `,
})
export class FileMenu {
  /** The file this menu acts on. */
  readonly file = input.required<FileItem>();

  /** Request to open the details pane for this file. */
  readonly details = output<void>();
  /** Request to open the share dialog for this file. */
  readonly share = output<void>();
  /** Request to download this file. */
  readonly download = output<void>();
  /** Request to rename this file. */
  readonly rename = output<void>();
  /** Request to delete this file. */
  readonly delete = output<void>();

  protected readonly menuOpen = signal(false);

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  protected onDetails(): void {
    this.menuOpen.set(false);
    this.details.emit();
  }
  protected onShare(): void {
    this.menuOpen.set(false);
    this.share.emit();
  }
  protected onDownload(): void {
    this.menuOpen.set(false);
    this.download.emit();
  }
  protected onRename(): void {
    this.menuOpen.set(false);
    this.rename.emit();
  }
  protected onDelete(): void {
    this.menuOpen.set(false);
    this.delete.emit();
  }
}
