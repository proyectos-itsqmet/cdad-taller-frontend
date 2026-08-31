/**
 * Wire-format DTOs for `kubo-analytics`, the Python/FastAPI service.
 *
 * Kept separate from `dto.ts` on purpose: that file is the contract with the
 * Spring backend, this one is the contract with a different service. Two
 * services, two contracts — mixing them hides which one broke when a shape
 * changes.
 *
 * Mirrors `app/schemas.py`. Keep the two in lockstep.
 */

/** Aggregation window scope. `all` is rejected server-side without ROLE_ADMIN. */
export type AnalyticsScope = 'me' | 'all';

export interface ActionCount {
  /** Raw backend action type, e.g. `UPLOAD`. Never rendered directly. */
  action: string;
  /** Spanish label to display. */
  label: string;
  count: number;
}

export interface ItemTypeCount {
  itemType: string;
  label: string;
  count: number;
}

export interface DayCount {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  count: number;
}

export interface HeatmapCell {
  /** 0 = Monday … 6 = Sunday, matching pandas' `dt.dayofweek`. */
  weekday: number;
  /** 0–23, local to the backend's clock. */
  hour: number;
  count: number;
}

export interface TopItem {
  itemName: string;
  count: number;
}

/** Response body of `GET /analytics/activity`. */
export interface ActivitySummary {
  rangeDays: number;
  scope: AnalyticsScope;
  totalEvents: number;
  activeUsers: number;
  /** Hour of day with the most events, or `null` when there is no data. */
  busiestHour: number | null;
  byAction: ActionCount[];
  byItemType: ItemTypeCount[];
  /**
   * Zero-filled across the whole window: a zero means "no activity that day",
   * never "no data point". The chart can therefore trust the array length.
   */
  byDay: DayCount[];
  /** Sparse — only non-zero cells. The client fills the 7x24 grid. */
  heatmap: HeatmapCell[];
  topItems: TopItem[];
}
