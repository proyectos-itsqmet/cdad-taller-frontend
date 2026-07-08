import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideChevronDown } from '@ng-icons/lucide';

/** Field a listing can be ordered by. */
export type SortField = 'name' | 'modified' | 'size' | 'type';
/** Sort direction. */
export type SortDir = 'asc' | 'desc';
/** Combined ordering state, shared between the menu and the file explorer. */
export interface SortState {
  field: SortField;
  dir: SortDir;
}

interface FieldOption {
  field: SortField;
  label: string;
  /** Sensible default direction when the field is first picked. */
  defaultDir: SortDir;
}

/**
 * kubo-sort-menu — dropdown to pick the ordering field + direction.
 * Two-way bindable via `[(value)]`. Self-manages its open/close state
 * (outside-click + Escape) with browser-only host listeners, so it is
 * SSR/zoneless-safe (no listeners are attached during prerender).
 */
@Component({
  selector: 'kubo-sort-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucideCheck })],
  host: {
    class: 'relative inline-block',
    '(document:click)': 'onDocumentClick()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
  template: `
    <button
      type="button"
      class="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-haspopup="menu"
      [attr.aria-expanded]="menuOpen()"
      (click)="toggle($event)"
    >
      <span class="text-muted-foreground">Ordenar:</span>
      <span>{{ activeLabel() }}</span>
      <ng-icon
        name="lucideChevronDown"
        class="text-base text-muted-foreground transition-transform motion-reduce:transition-none"
        [class.rotate-180]="menuOpen()"
        aria-hidden="true"
      />
    </button>

    @if (menuOpen()) {
      <div
        class="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        role="menu"
        aria-label="Opciones de orden"
      >
        <p class="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ordenar por
        </p>
        @for (opt of fields; track opt.field) {
          <button
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="value().field === opt.field"
            class="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            [class.font-semibold]="value().field === opt.field"
            (click)="pick(opt)"
          >
            <span>{{ opt.label }}</span>
            @if (value().field === opt.field) {
              <ng-icon
                name="lucideChevronDown"
                class="text-base text-brand transition-transform motion-reduce:transition-none"
                [class.rotate-180]="value().dir === 'asc'"
                [attr.aria-label]="value().dir === 'asc' ? 'Ascendente' : 'Descendente'"
              />
            }
          </button>
        }

        <div class="my-1 h-px bg-border"></div>

        <div class="flex gap-1 p-1" role="group" aria-label="Dirección">
          <button
            type="button"
            class="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            [class]="dirBtnClass('asc')"
            [attr.aria-pressed]="value().dir === 'asc'"
            (click)="setDir('asc')"
          >
            @if (value().dir === 'asc') {
              <ng-icon name="lucideCheck" class="text-sm" aria-hidden="true" />
            }
            Ascendente
          </button>
          <button
            type="button"
            class="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            [class]="dirBtnClass('desc')"
            [attr.aria-pressed]="value().dir === 'desc'"
            (click)="setDir('desc')"
          >
            @if (value().dir === 'desc') {
              <ng-icon name="lucideCheck" class="text-sm" aria-hidden="true" />
            }
            Descendente
          </button>
        </div>
      </div>
    }
  `,
})
export class SortMenu {
  /** Current ordering; two-way bindable via `[(value)]`. */
  readonly value = model<SortState>({ field: 'name', dir: 'asc' });

  protected readonly menuOpen = signal(false);

  protected readonly fields: readonly FieldOption[] = [
    { field: 'name', label: 'Nombre', defaultDir: 'asc' },
    { field: 'modified', label: 'Modificado', defaultDir: 'desc' },
    { field: 'size', label: 'Tamaño', defaultDir: 'desc' },
    { field: 'type', label: 'Tipo', defaultDir: 'asc' },
  ];

  protected readonly activeLabel = computed(
    () =>
      this.fields.find((f) => f.field === this.value().field)?.label ?? 'Nombre',
  );

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  protected onDocumentClick(): void {
    this.menuOpen.set(false);
  }

  /** Pick a field: toggle direction if it's already active, else apply its default. */
  protected pick(opt: FieldOption): void {
    const current = this.value();
    if (current.field === opt.field) {
      this.value.set({
        field: opt.field,
        dir: current.dir === 'asc' ? 'desc' : 'asc',
      });
    } else {
      this.value.set({ field: opt.field, dir: opt.defaultDir });
    }
  }

  protected setDir(dir: SortDir): void {
    if (this.value().dir !== dir) {
      this.value.update((v) => ({ ...v, dir }));
    }
  }

  protected dirBtnClass(dir: SortDir): string {
    return this.value().dir === dir
      ? 'bg-brand/10 font-semibold text-brand'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground';
  }
}
