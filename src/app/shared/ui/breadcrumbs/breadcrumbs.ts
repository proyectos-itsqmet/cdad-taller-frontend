import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { Folder } from '../../../core/models/models';

interface Crumb {
  label: string;
  link?: string;
  current: boolean;
  ellipsis?: boolean;
}

/**
 * kubo-breadcrumbs — folder path trail.
 * Renders "root / A / B / current" with chevron separators; the last segment is
 * bold and non-interactive. Collapses the middle into "…" beyond 4 segments.
 */
@Component({
  selector: 'kubo-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideChevronRight })],
  host: { class: 'block min-w-0' },
  template: `
    <nav class="flex items-center gap-1 overflow-hidden text-sm" aria-label="Ruta de navegación">
      @for (crumb of display(); track $index) {
        @if (!$first) {
          <ng-icon name="lucideChevronRight" class="shrink-0 text-base text-muted-foreground" aria-hidden="true" />
        }
        @if (crumb.ellipsis) {
          <span class="px-0.5 text-muted-foreground" aria-hidden="true">…</span>
        } @else if (crumb.current) {
          <span class="truncate font-semibold text-foreground" aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a
            [routerLink]="crumb.link"
            class="truncate rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >{{ crumb.label }}</a>
        }
      }
    </nav>
  `,
})
export class Breadcrumbs {
  /** Ancestor chain root..current (excluding the synthetic root segment). */
  readonly items = input<Folder[]>([]);
  /** Label for the synthetic root segment. */
  readonly rootLabel = input<string>('Mi unidad');
  /** RouterLink for the synthetic root segment. */
  readonly rootLink = input<string>('/archivos');

  protected readonly display = computed<Crumb[]>(() => {
    const folders = this.items();
    const crumbs: Crumb[] = [{ label: this.rootLabel(), link: this.rootLink(), current: folders.length === 0 }];

    folders.forEach((f, i) => {
      crumbs.push({ label: f.name, link: `/archivos/${f.id}`, current: i === folders.length - 1 });
    });

    // Last segment is always the current, non-interactive one.
    const last = crumbs[crumbs.length - 1];
    last.current = true;
    last.link = undefined;

    if (crumbs.length > 4) {
      return [
        crumbs[0],
        { label: '…', current: false, ellipsis: true },
        crumbs[crumbs.length - 2],
        crumbs[crumbs.length - 1],
      ];
    }
    return crumbs;
  });
}
