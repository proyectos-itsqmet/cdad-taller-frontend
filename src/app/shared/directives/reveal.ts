import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  afterNextRender,
  inject,
  input,
  type OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * kuboReveal — on-scroll reveal (fade + translate-y up).
 *
 * SSR/prerender SAFE: the element's DEFAULT state is fully visible, so the
 * prerendered HTML always shows its content. Only once we're in the browser
 * (via `afterNextRender`) do we apply the pre-reveal hidden state and start
 * observing; when the element scrolls into view it animates to its resting
 * position exactly once.
 *
 * Fully respects `prefers-reduced-motion`: when reduced motion is requested we
 * never hide or animate — the element simply stays visible. Same graceful
 * fallback when `IntersectionObserver` is unavailable.
 *
 * Usage:
 *   <section kuboReveal>…</section>
 *   <div kuboReveal [delay]="150">…</div>   // stagger by 150ms
 */
@Directive({
  selector: '[kuboReveal]',
})
export class Reveal implements OnDestroy {
  /** Extra delay (ms) before the reveal transition begins — handy for stagger. */
  readonly delay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private observer?: IntersectionObserver;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      // Server / prerender: leave the element untouched and fully visible.
      return;
    }

    afterNextRender(() => {
      const el = this.host.nativeElement;

      // Respect reduced-motion: never hide or animate — keep it visible.
      const prefersReduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // No IntersectionObserver support -> keep content visible (no-op).
      if (prefersReduced || typeof IntersectionObserver === 'undefined') {
        return;
      }

      const ms = Math.max(0, this.delay());

      // Apply the pre-reveal hidden state now that we're safely in the browser.
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'transform', 'translateY(1.25rem)');
      this.renderer.setStyle(el, 'will-change', 'opacity, transform');
      this.renderer.setStyle(
        el,
        'transition',
        `opacity 600ms cubic-bezier(0.22, 1, 0.36, 1) ${ms}ms, transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${ms}ms`,
      );

      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.reveal(el);
              break;
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
      );
      this.observer.observe(el);
    });
  }

  private reveal(el: HTMLElement): void {
    this.renderer.setStyle(el, 'opacity', '1');
    this.renderer.setStyle(el, 'transform', 'translateY(0)');
    this.observer?.disconnect();
    this.observer = undefined;

    // Release the compositor hint once the transition finishes.
    const done = () => {
      this.renderer.removeStyle(el, 'will-change');
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
