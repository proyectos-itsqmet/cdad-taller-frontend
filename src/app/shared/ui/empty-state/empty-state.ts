import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideCloud,
  lucideFile,
  lucideFileText,
  lucideFolder,
  lucideFolderOpen,
  lucideHardDrive,
  lucideInbox,
  lucideSearch,
  lucideShare2,
  lucideStar,
  lucideUsers,
} from '@ng-icons/lucide';

/**
 * kubo-empty-state — friendly centered placeholder for empty collections.
 * `icon` must be one of the registered lucide names below (defaults cover the
 * common cases: files, folders, starred, recent, shared, search).
 */
@Component({
  selector: 'kubo-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, RouterLink],
  providers: [
    provideIcons({
      lucideInbox,
      lucideFolder,
      lucideFolderOpen,
      lucideStar,
      lucideClock,
      lucideShare2,
      lucideSearch,
      lucideFile,
      lucideFileText,
      lucideCloud,
      lucideUsers,
      lucideHardDrive,
    }),
  ],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span class="flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
        <ng-icon [name]="icon()" class="text-3xl" aria-hidden="true" />
      </span>
      <div class="flex max-w-sm flex-col gap-1.5">
        <h3 class="font-heading text-lg font-semibold text-foreground">{{ title() }}</h3>
        @if (message()) {
          <p class="text-sm text-muted-foreground">{{ message() }}</p>
        }
      </div>
      @if (actionLabel() && actionLink()) {
        <a
          [routerLink]="actionLink()"
          class="mt-1 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >{{ actionLabel() }}</a>
      }
    </div>
  `,
})
export class EmptyState {
  /** Registered lucide icon name. */
  readonly icon = input<string>('lucideInbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly actionLabel = input<string>();
  /** RouterLink target for the optional action button. */
  readonly actionLink = input<string | unknown[]>();
}
