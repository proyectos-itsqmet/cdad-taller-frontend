import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideShare2 } from '@ng-icons/lucide';
import { DataService } from '../../../core/data/data.service';
import { ActivityEvent } from '../../../core/models/models';
import { relativeTime } from '../../../core/util/format';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

type ActivityFilter = 'todos' | 'shared' | 'modified';

interface FilterOption {
  value: ActivityFilter;
  label: string;
}

/** A single, presentation-ready activity row. */
interface EventVM {
  id: string;
  icon: string;
  iconClass: string;
  sentence: string;
  time: string;
}

/** A day bucket in the timeline (e.g. "Hoy", "Ayer", "8 de julio de 2026"). */
interface DayGroup {
  key: string;
  label: string;
  events: EventVM[];
}

const KIND_ICON: Record<ActivityEvent['kind'], string> = {
  shared: 'lucideShare2',
  modified: 'lucidePencil',
  created: 'lucidePlus',
};

const KIND_ICON_CLASS: Record<ActivityEvent['kind'], string> = {
  shared: 'bg-brand/10 text-brand',
  modified: 'bg-warning/15 text-warning',
  created: 'bg-success/15 text-success',
};

/**
 * Activity — "Actividad". Renders the synthesized activity feed as a
 * chronological timeline grouped by day (Hoy / Ayer / date), with a
 * type filter (Todos / Compartidos / Modificados).
 */
@Component({
  selector: 'kubo-settings-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, EmptyState],
  providers: [provideIcons({ lucideShare2, lucidePencil, lucidePlus })],
  host: { class: 'block' },
  templateUrl: './activity.html',
})
export class Activity {
  private readonly data = inject(DataService);

  protected readonly filter = signal<ActivityFilter>('todos');

  protected readonly filterOptions: readonly FilterOption[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'shared', label: 'Compartidos' },
    { value: 'modified', label: 'Modificados' },
  ];

  /** Fast fileId -> name lookup, rebuilt only when the file set changes. */
  private readonly fileNames = computed(
    () => new Map(this.data.files().map((f) => [f.id, f.originalName])),
  );

  /** The feed grouped into day buckets, honouring the active filter. */
  protected readonly groups = computed<DayGroup[]>(() => {
    const active = this.filter();
    const events = this.data
      .activityFeed()
      .filter((e) => (active === 'todos' ? true : e.kind === active));

    const byDay = new Map<string, DayGroup>();
    const order: string[] = [];

    for (const event of events) {
      const date = new Date(event.at);
      const key = this.dayKey(date);
      let group = byDay.get(key);
      if (!group) {
        group = { key, label: this.dayLabel(date, key), events: [] };
        byDay.set(key, group);
        order.push(key);
      }
      group.events.push(this.toVM(event));
    }

    return order.map((k) => byDay.get(k)!);
  });

  protected readonly isEmpty = computed(() => this.groups().length === 0);

  protected readonly emptyMessage = computed(() => {
    switch (this.filter()) {
      case 'shared':
        return 'No hay actividad de archivos compartidos.';
      case 'modified':
        return 'No hay archivos modificados recientemente.';
      default:
        return 'Cuando trabajes con tus archivos, lo verás acá.';
    }
  });

  protected setFilter(value: ActivityFilter): void {
    this.filter.set(value);
  }

  private toVM(event: ActivityEvent): EventVM {
    return {
      id: event.id,
      icon: KIND_ICON[event.kind],
      iconClass: KIND_ICON_CLASS[event.kind],
      sentence: this.describe(event),
      time: relativeTime(event.at),
    };
  }

  private describe(event: ActivityEvent): string {
    const meId = this.data.currentUser().id;
    const file = this.fileName(event.fileId);

    switch (event.kind) {
      case 'shared': {
        if (event.actorUserId === meId) {
          const target = event.targetUserId ? this.userName(event.targetUserId) : 'alguien';
          return `Compartiste ${file} con ${target}`;
        }
        return `${this.userName(event.actorUserId)} compartió ${file} contigo`;
      }
      case 'modified':
        return `Modificaste ${file}`;
      case 'created':
        return `Creaste ${file}`;
    }
  }

  private fileName(fileId?: string): string {
    if (!fileId) return '«un archivo»';
    const name = this.fileNames().get(fileId);
    return name ? `«${name}»` : '«un archivo»';
  }

  private userName(userId: string): string {
    return this.data.userById(userId)?.name ?? 'alguien';
  }

  /** Local calendar-day key, e.g. "2026-6-8". */
  private dayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private dayLabel(date: Date, key: string): string {
    const now = new Date();
    if (key === this.dayKey(now)) return 'Hoy';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (key === this.dayKey(yesterday)) return 'Ayer';

    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
