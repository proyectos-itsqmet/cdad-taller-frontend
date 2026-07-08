import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SkeletonVariant = 'card' | 'row' | 'text';

/**
 * kubo-skeleton — shimmer placeholders. Respects prefers-reduced-motion.
 */
@Component({
  selector: 'kubo-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @for (i of items(); track $index) {
      @switch (variant()) {
        @case ('card') {
          <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            <div class="aspect-video w-full animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none"></div>
            <div class="h-4 w-3/4 animate-pulse rounded bg-surface-muted motion-reduce:animate-none"></div>
            <div class="h-3 w-1/2 animate-pulse rounded bg-surface-muted motion-reduce:animate-none"></div>
          </div>
        }
        @case ('row') {
          <div class="flex items-center gap-3 px-2 py-2.5">
            <div class="size-9 shrink-0 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none"></div>
            <div class="h-4 flex-1 animate-pulse rounded bg-surface-muted motion-reduce:animate-none"></div>
            <div class="h-4 w-16 shrink-0 animate-pulse rounded bg-surface-muted motion-reduce:animate-none"></div>
          </div>
        }
        @default {
          <div class="h-4 w-full animate-pulse rounded bg-surface-muted motion-reduce:animate-none"></div>
        }
      }
    }
  `,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('text');
  readonly count = input<number>(1);

  protected readonly items = computed(() => Array.from({ length: Math.max(1, this.count()) }));
}
