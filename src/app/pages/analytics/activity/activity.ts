import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCalendarDays,
  lucideClock,
  lucideRefreshCw,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideUsers,
} from '@ng-icons/lucide';

import { environment } from '../../../../environments/environment';
import { ActivitySummary, AnalyticsScope } from '../../../core/api/analytics.dto';
import { AuthService } from '../../../core/auth/auth.service';
import { shortDate } from '../../../core/util/format';
import { ActivityHeatmap } from '../../../shared/ui/activity-heatmap/activity-heatmap';
import { BarChart } from '../../../shared/ui/bar-chart/bar-chart';
import { LineChart } from '../../../shared/ui/line-chart/line-chart';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';

/** Selectable look-back windows, in days. */
const RANGE_OPTIONS = [7, 30, 90] as const;

/**
 * Activity — "Mis analíticas" at `/analitica`.
 *
 * The only page in the app whose data comes from `kubo-analytics` (Python /
 * FastAPI) instead of the Spring backend. Same `jwt` cookie, different
 * service: the token is self-contained, so that service verifies it locally
 * with the shared HMAC secret and never asks Spring who is calling.
 *
 * Loads through `httpResource`, which is idle during SSR (no cookie to call
 * with on the server) — so the prerendered HTML is the skeleton, and the real
 * numbers arrive after hydration.
 *
 * Admins get a scope toggle for cross-user activity. That is an affordance,
 * not a permission: `scope=all` is rejected server-side without ROLE_ADMIN,
 * which is why hiding the button is safe but not sufficient.
 */
@Component({
  selector: 'kubo-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, StatCard, BarChart, LineChart, ActivityHeatmap, Skeleton],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCalendarDays,
      lucideUsers,
      lucideClock,
      lucideTrendingUp,
      lucideRefreshCw,
      lucideTriangleAlert,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './activity.html',
})
export class Activity {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  /** Drives whether the cross-user scope toggle is offered at all. */
  protected readonly isAdmin = this.authService.isAdmin;

  protected readonly rangeOptions = RANGE_OPTIONS;
  /** One placeholder per KPI tile while the first payload is in flight. */
  protected readonly skeletonCards = [0, 1, 2, 3];

  // --- Controls ----------------------------------------------------------
  protected readonly days = signal<number>(30);
  protected readonly scope = signal<AnalyticsScope>('me');

  /** Colour sets for the segmented controls, mirroring the Settings tabs. */
  protected readonly activeClass = 'bg-brand text-brand-fg shadow-sm';
  protected readonly idleClass =
    'text-muted-foreground hover:bg-surface-muted hover:text-foreground';

  // --- Data load ---------------------------------------------------------
  protected readonly summary = httpResource<ActivitySummary>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    return {
      url: `${environment.analyticsBaseUrl}/analytics/activity`,
      params: { days: this.days(), scope: this.scope() },
    };
  });

  /**
   * True until the first payload lands, errors included in the negative.
   * Keyed on `value()` rather than `isLoading()` on purpose: during prerender
   * the request is never issued, so `isLoading()` is false and the page would
   * otherwise bake as "no activity" before hydration corrects it.
   */
  protected readonly isPending = computed(
    () => this.summary.value() === undefined && this.summary.error() === undefined,
  );

  // --- Derived view models ----------------------------------------------
  protected readonly actionBars = computed(() =>
    (this.summary.value()?.byAction ?? []).map((entry) => ({
      label: entry.label,
      value: entry.count,
    })),
  );

  protected readonly itemTypeBars = computed(() =>
    (this.summary.value()?.byItemType ?? []).map((entry) => ({
      label: entry.label,
      value: entry.count,
    })),
  );

  protected readonly topItemBars = computed(() =>
    (this.summary.value()?.topItems ?? []).map((entry) => ({
      label: entry.itemName,
      value: entry.count,
    })),
  );

  protected readonly dailySeries = computed(() => this.summary.value()?.byDay ?? []);
  protected readonly heatmap = computed(() => this.summary.value()?.heatmap ?? []);

  /** Pre-formatted KPI strings. Em dash while there is nothing to show. */
  protected readonly kpis = computed(() => {
    const data = this.summary.value();
    if (!data) {
      return {
        totalEvents: '—',
        activeUsers: '—',
        busiestHour: '—',
        dailyAverage: '—',
        busiestDay: '—',
        busiestDayHint: '',
      };
    }

    const average = data.byDay.length ? data.totalEvents / data.byDay.length : 0;

    // Busiest day. `byDay` is zero-filled server-side, so an all-quiet window
    // yields a peak of 0 — reported as an em dash rather than a fake winner.
    const peak = data.byDay.reduce(
      (best, day) => (day.count > best.count ? day : best),
      { date: '', count: 0 },
    );

    return {
      totalEvents: String(data.totalEvents),
      activeUsers: String(data.activeUsers),
      busiestHour:
        data.busiestHour !== null ? `${String(data.busiestHour).padStart(2, '0')}:00` : '—',
      dailyAverage: average.toFixed(1).replace(/\.0$/, ''),
      busiestDay: peak.count > 0 ? shortDate(peak.date) : '—',
      busiestDayHint:
        peak.count > 0 ? `${peak.count} ${peak.count === 1 ? 'evento' : 'eventos'}` : 'Sin actividad',
    };
  });

  /**
   * A message that says which link of the chain broke, because "algo falló"
   * costs an afternoon of debugging in a four-service deployment.
   */
  protected readonly errorMessage = computed(() => {
    const error = this.summary.error();
    if (!error) return null;

    switch ((error as { status?: number }).status) {
      case 0:
        return 'No se pudo contactar al servicio de analítica. Verificá que el contenedor kubo-analytics esté levantado.';
      case 401:
        return 'Tu sesión expiró o el token no es válido. Volvé a iniciar sesión.';
      case 403:
        return 'Ver la actividad de todos los usuarios requiere rol de administrador.';
      case 502:
        return 'El servicio de analítica no pudo leer del backend. Suele ser el X-Internal-Token: revisá que coincida en ambos contenedores.';
      case 503:
        return 'El servicio de analítica no pudo contactar al backend.';
      default:
        return 'No se pudo cargar la analítica. Intentá de nuevo.';
    }
  });

  protected readonly scopeLabel = computed(() =>
    this.scope() === 'all' ? 'Todos los usuarios' : 'Mi actividad',
  );

  // --- Actions -----------------------------------------------------------
  protected setDays(days: number): void {
    this.days.set(days);
  }

  protected setScope(scope: AnalyticsScope): void {
    this.scope.set(scope);
  }

  protected reload(): void {
    this.summary.reload();
  }
}
