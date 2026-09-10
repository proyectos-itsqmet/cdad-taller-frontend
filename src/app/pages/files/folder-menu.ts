import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsisVertical, lucidePencil, lucideTrash2, lucideShare2, lucideUserMinus } from '@ng-icons/lucide';
import { Folder } from '../../core/models/models';

@Component({
  selector: 'kubo-folder-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideEllipsisVertical,
      lucidePencil,
      lucideTrash2,
      lucideShare2,
      lucideUserMinus,
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
      [attr.aria-label]="'Más acciones para ' + folder().name"
      (click)="toggle($event)"
    >
      <ng-icon name="lucideEllipsisVertical" class="text-lg" aria-hidden="true" />
    </button>

    @if (menuOpen()) {
      <div
        class="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1.5 text-left shadow-lg"
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          class="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="share.emit(); toggle($event)"
        >
          <ng-icon name="lucideShare2" class="text-base text-muted-foreground" aria-hidden="true" />
          Compartir
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
export class FolderMenu {
  readonly folder = input.required<Folder>();
  readonly delete = output<void>();
  readonly rename = output<void>();
  readonly share = output<void>();
  protected readonly menuOpen = signal(false);

  protected toggle(event: Event): void {
    event.preventDefault(); // prevent routerLink from firing if it's inside an anchor
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }
}
