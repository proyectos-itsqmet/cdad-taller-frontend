import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** One labelled row of the chart. */
export interface BarDatum {
  label: string;
  value: number;
}

/**
 * kubo-bar-chart — horizontal bars for a small set of labelled counts.
 *
 * Plain flex rows rather than SVG: for a ranked list of a handful of values,
 * DOM elements are simpler, reflow correctly at any width, and inherit the
 * theme tokens without any of the sizing math a viewBox needs.
 *
 * Bars are scaled against the largest value, not the total — the question this
 * answers is "which is biggest", not "what share of the whole".
 */
@Component({
  selector: 'kubo-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (rows().length) {
      <ul class="flex flex-col gap-3">
        @for (row of rows(); track row.label) {
          <li class="flex flex-col gap-1.5">
            <div class="flex items-baseline justify-between gap-3">
              <span class="truncate text-sm font-medium text-foreground">{{ row.label }}</span>
              <span class="shrink-0 text-sm tabular-nums text-muted-foreground">
                {{ row.value }}
              </span>
            </div>
            <div
              class="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
              role="img"
              [attr.aria-label]="row.label + ': ' + row.value"
            >
              <div
                class="h-full rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none"
                [style.width.%]="row.percent"
              ></div>
            </div>
          </li>
        }
      </ul>
    } @else {
      <p class="py-6 text-center text-sm text-muted-foreground">{{ emptyMessage() }}</p>
    }
  `,
})
export class BarChart {
  readonly data = input.required<readonly BarDatum[]>();
  readonly emptyMessage = input<string>('Sin datos en este período.');

  /**
   * Bars sorted high to low, with a width percentage. A zero-only dataset
   * still renders rows (at 0%) rather than collapsing to the empty state —
   * "everything is zero" is information.
   */
  protected readonly rows = computed(() => {
    const data = this.data();
    const max = Math.max(...data.map((d) => d.value), 0);
    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((d) => ({
        label: d.label,
        value: d.value,
        percent: max > 0 ? (d.value / max) * 100 : 0,
      }));
  });
}
