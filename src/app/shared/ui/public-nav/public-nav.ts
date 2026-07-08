import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox, lucideMenu, lucideX } from '@ng-icons/lucide';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavAnchor {
  label: string;
  fragment: string;
}

/**
 * kubo-public-nav — sticky marketing top navigation.
 *
 * Condenses on scroll (translucent surface + backdrop blur once past the fold).
 * Desktop (lg+) shows centered section anchors and the auth actions inline;
 * below lg everything collapses into a signal-driven, accessible mobile menu
 * that closes on navigation and on Escape. All scroll/keyboard listeners are
 * browser-guarded so the component is SSR/prerender safe.
 */
@Component({
  selector: 'kubo-public-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, ThemeToggle],
  providers: [provideIcons({ lucideBox, lucideMenu, lucideX })],
  host: {
    class: 'block',
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'closeMenu()',
  },
  templateUrl: './public-nav.html',
})
export class PublicNav {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** True once the page has scrolled past the top — drives the condensed style. */
  protected readonly scrolled = signal(false);
  /** Mobile menu open state. */
  protected readonly menuOpen = signal(false);

  protected readonly links: readonly NavAnchor[] = [
    { label: 'Producto', fragment: 'producto' },
    { label: 'Seguridad', fragment: 'seguridad' },
    { label: 'Precios', fragment: 'precios' },
  ];

  protected readonly headerClass = computed(() =>
    [
      'sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
      this.scrolled()
        ? 'border-border bg-surface/80 shadow-sm backdrop-blur-md'
        : 'border-transparent bg-transparent',
    ].join(' '),
  );

  constructor() {
    // Reflect the initial scroll position (e.g. deep-link / refresh mid-page).
    afterNextRender(() => this.updateScrolled());
  }

  protected onScroll(): void {
    this.updateScrolled();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  private updateScrolled(): void {
    if (!this.isBrowser) {
      return;
    }
    this.scrolled.set(window.scrollY > 8);
  }
}
