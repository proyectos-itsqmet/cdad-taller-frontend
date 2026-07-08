import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGrid2x2, lucideGrid3x3, lucideList } from '@ng-icons/lucide';
import { ViewMode } from '../../../core/models/models';

interface Option {
  mode: ViewMode;
  icon: string;
  label: string;
}

/**
 * kubo-view-switcher — segmented control to pick the list/grid view mode.
 * Two-way bindable via `[(value)]`.
 */
@Component({
  selector: 'kubo-view-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideGrid2x2, lucideGrid3x3, lucideList })],
  host: { class: 'inline-flex' },
  template: `
    <div class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1" role="group" aria-label="Modo de vista">
      @for (opt of options; track opt.mode) {
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-md text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          [class]="btnClass(value() === opt.mode)"
          [attr.aria-pressed]="value() === opt.mode"
          [attr.aria-label]="opt.label"
          [title]="opt.label"
          (click)="value.set(opt.mode)"
        >
          <ng-icon [name]="opt.icon" aria-hidden="true" />
        </button>
      }
    </div>
  `,
})
export class ViewSwitcher {
  /** Active view mode; two-way bindable. */
  readonly value = model<ViewMode>('grid-large');

  protected readonly options: readonly Option[] = [
    { mode: 'grid-large', icon: 'lucideGrid2x2', label: 'Cuadrícula grande' },
    { mode: 'grid-small', icon: 'lucideGrid3x3', label: 'Cuadrícula pequeña' },
    { mode: 'list', icon: 'lucideList', label: 'Lista' },
  ];

  protected btnClass(active: boolean): string {
    return active
      ? 'bg-brand text-brand-fg'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground';
  }
}
