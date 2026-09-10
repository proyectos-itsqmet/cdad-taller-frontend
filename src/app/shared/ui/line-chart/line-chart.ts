import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { shortDate } from '../../../core/util/format';

/** One point of the series. */
export interface LinePoint {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  count: number;
}

/** Internal viewBox units. Nothing about them reaches the rendered size. */
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;

/**
 * kubo-line-chart — a daily-count area chart.
 *
 * Inline SVG rather than a charting library, for one concrete reason: the page
 * is theme-aware. `stroke`/`fill` are `currentColor`, the host carries
 * `text-brand`, and the whole thing recolors when the user flips the theme.
 * A server-rendered PNG could not do that, and a JS chart library would cost
 * ~50kB to draw one path.
 *
 * `preserveAspectRatio="none"` stretches the viewBox to whatever width the
 * container has; `vector-effect="non-scaling-stroke"` keeps the line 1px
 * regardless, so it never smears.
 *
 * The series is expected to be zero-filled by the server — the x axis is the
 * array index, so a missing day would silently shift every later point.
 */
@Component({
  selector: 'kubo-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block text-brand' },
  template: `
    @if (geometry(); as g) {
      <figure class="flex flex-col gap-2">
        <svg
          [attr.viewBox]="viewBox"
          preserveAspectRatio="none"
          class="h-32 w-full overflow-visible"
          role="img"
          [attr.aria-label]="ariaLabel()"
        >
          <path [attr.d]="g.area" fill="currentColor" fill-opacity="0.12" />
          <path
            [attr.d]="g.line"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <figcaption class="flex justify-between text-xs text-muted-foreground">
          <span>{{ g.firstLabel }}</span>
          <span class="tabular-nums">pico: {{ g.max }}</span>
          <span>{{ g.lastLabel }}</span>
        </figcaption>
      </figure>
    } @else {
      <p class="py-10 text-center text-sm text-muted-foreground">
        Se necesitan al menos dos días de datos para dibujar la serie.
      </p>
    }
  `,
})
export class LineChart {
  readonly data = input.required<readonly LinePoint[]>();

  protected readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

  protected readonly ariaLabel = computed(() => {
    const g = this.geometry();
    return g
      ? `Actividad diaria, ${this.data().length} días, máximo ${g.max} eventos`
      : 'Actividad diaria, sin datos suficientes';
  });

  /**
   * The two SVG paths plus the axis labels, or `null` when a line is
   * meaningless. Scaled against the series max (floored at 1) so an all-zero
   * window draws a flat line on the baseline instead of dividing by zero.
   */
  protected readonly geometry = computed(() => {
    const points = this.data();
    if (points.length < 2) return null;

    const max = Math.max(1, ...points.map((p) => p.count));
    const step = VIEW_WIDTH / (points.length - 1);

    const coords = points.map((point, index) => ({
      x: index * step,
      y: VIEW_HEIGHT - (point.count / max) * VIEW_HEIGHT,
    }));

    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
      .join(' ');

    return {
      line,
      area: `${line} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`,
      max: Math.max(...points.map((p) => p.count)),
      firstLabel: shortDate(points[0].date),
      lastLabel: shortDate(points[points.length - 1].date),
    };
  });
}
