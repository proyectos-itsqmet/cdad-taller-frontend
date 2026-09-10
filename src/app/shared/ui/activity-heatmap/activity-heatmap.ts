import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** One non-empty bucket of the weekday x hour grid. */
export interface HeatmapDatum {
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  /** 0–23. */
  hour: number;
  count: number;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Hours to label on the axis; labelling all 24 is unreadable at this size. */
const LABELLED_HOURS = new Set([0, 6, 12, 18]);
/** Floor so a single event is still visible against the empty-cell colour. */
const MIN_OPACITY = 0.18;

/**
 * kubo-activity-heatmap — a 7x24 weekday-by-hour grid of event counts.
 *
 * Intensity is the brand colour's OPACITY, not a step off the static
 * `--color-brand-50…950` scale. That scale does not flip with the theme, so
 * `brand-50` (near-white) would read as *high* intensity on the dark canvas —
 * exactly backwards. Opacity over `bg-brand` stays correct in both themes,
 * because `--brand` itself is theme-aware.
 *
 * The server sends only non-zero cells; this component fills the rest.
 */
@Component({
  selector: 'kubo-activity-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="overflow-x-auto">
      <div class="flex min-w-max flex-col gap-1">
        @for (row of grid(); track row.weekday) {
          <div class="flex items-center gap-1">
            <span class="w-9 shrink-0 text-right text-xs text-muted-foreground">
              {{ row.label }}
            </span>
            @for (cell of row.cells; track cell.hour) {
              <span
                class="size-4 shrink-0 rounded-sm"
                [class.bg-brand]="cell.count > 0"
                [class.bg-surface-muted]="cell.count === 0"
                [style.opacity]="cell.count > 0 ? cell.opacity : null"
                [title]="cell.title"
              ></span>
            }
          </div>
        }

        <!-- Hour axis, aligned to the cells above via the same leading spacer. -->
        <div class="mt-0.5 flex items-center gap-1" aria-hidden="true">
          <span class="w-9 shrink-0"></span>
          @for (hour of hours; track hour) {
            <span class="w-4 shrink-0 text-center text-[10px] text-muted-foreground">
              {{ isLabelled(hour) ? hour : '' }}
            </span>
          }
        </div>
      </div>
    </div>

    <p class="mt-3 text-xs text-muted-foreground">
      {{ summary() }}
    </p>
  `,
})
export class ActivityHeatmap {
  readonly data = input.required<readonly HeatmapDatum[]>();

  protected readonly hours = HOURS;

  protected isLabelled(hour: number): boolean {
    return LABELLED_HOURS.has(hour);
  }

  /** Dense 7x24 grid, built from the sparse input. */
  protected readonly grid = computed(() => {
    const counts = new Map<string, number>();
    let max = 0;
    for (const cell of this.data()) {
      counts.set(`${cell.weekday}-${cell.hour}`, cell.count);
      if (cell.count > max) max = cell.count;
    }

    return WEEKDAYS.map((label, weekday) => ({
      weekday,
      label,
      cells: HOURS.map((hour) => {
        const count = counts.get(`${weekday}-${hour}`) ?? 0;
        return {
          hour,
          count,
          // Scale the remaining range above the floor, so 1 event and `max`
          // events are visibly different rather than both looking full.
          opacity:
            max > 0 && count > 0
              ? MIN_OPACITY + (count / max) * (1 - MIN_OPACITY)
              : 0,
          title: `${label} ${String(hour).padStart(2, '0')}:00 — ${count} ${
            count === 1 ? 'evento' : 'eventos'
          }`,
        };
      }),
    }));
  });

  protected readonly summary = computed(() => {
    const data = this.data();
    if (!data.length) return 'Sin actividad registrada en este período.';
    const busiest = data.reduce((a, b) => (b.count > a.count ? b : a));
    const day = WEEKDAYS[busiest.weekday] ?? '';
    return `Momento más activo: ${day} a las ${String(busiest.hour).padStart(2, '0')}:00 (${busiest.count} eventos).`;
  });
}
