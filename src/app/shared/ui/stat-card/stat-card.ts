import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideClock,
  lucideTrendingUp,
  lucideUsers,
} from '@ng-icons/lucide';

/**
 * kubo-stat-card — a single KPI tile: icon, label, big value, optional hint.
 *
 * `icon` must be one of the names registered below.
 */
@Component({
  selector: 'kubo-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideActivity,
      lucideUsers,
      lucideClock,
      lucideTrendingUp,
    }),
  ],
  host: { class: 'block' },
  template: `
    <div class="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div class="flex items-center gap-2.5">
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
        >
          <ng-icon [name]="icon()" class="text-lg" aria-hidden="true" />
        </span>
        <span class="text-sm font-medium text-muted-foreground">{{ label() }}</span>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="font-heading text-2xl font-bold tracking-tight text-foreground">
          {{ value() }}
        </span>
        @if (hint()) {
          <span class="text-xs text-muted-foreground">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
})
export class StatCard {
  /** Registered lucide icon name. */
  readonly icon = input<string>('lucideActivity');
  readonly label = input.required<string>();
  /** Pre-formatted for display — this component never formats numbers. */
  readonly value = input.required<string>();
  readonly hint = input<string>('');
}
