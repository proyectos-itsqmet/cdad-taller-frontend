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

/** Tooltip shown on every action disabled in this read-only mockup. */
const MOCK_TOOLTIP = 'Disponible en la versión completa';

/**
 * kubo-file-menu — trailing kebab with per-file actions.
 * Real actions ("Ver detalles", "Compartir") emit to the parent; write actions
 * (Descargar/Renombrar/Eliminar) are disabled mocks. Self-manages open/close
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
          (click)="details.emit()"
        >
          <ng-icon name="lucideInfo" class="text-base text-muted-foreground" aria-hidden="true" />
          Ver detalles
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="share.emit()"
        >
          <ng-icon name="lucideShare2" class="text-base text-muted-foreground" aria-hidden="true" />
          Compartir
        </button>

        <div class="my-1 h-px bg-border"></div>

        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="download.emit(); toggle($event)"
        >
          <ng-icon name="lucideDownload" class="text-base text-muted-foreground" aria-hidden="true" />
          Descargar
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="rename.emit(); toggle($event)"
        >
          <ng-icon name="lucidePencil" class="text-base text-muted-foreground" aria-hidden="true" />
          Renombrar
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-destructive transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="delete.emit(); toggle($event)"
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
  /** Request to delete this file. */
  readonly delete = output<void>();
  /** Request to rename this file. */
  readonly rename = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly mockTooltip = MOCK_TOOLTIP;

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }
}
