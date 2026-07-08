import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { ThemeMode } from '../models/models';

const STORAGE_KEY = 'kubo-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * SSR-safe theme controller.
 *
 * - `mode` is the user's choice (light | dark | system), persisted to localStorage.
 * - `resolved` collapses "system" to a concrete light/dark using matchMedia, and
 *   reacts to OS preference changes.
 * - An effect toggles the `dark` class on <html> to match `resolved()`.
 *
 * All browser-only access (localStorage, matchMedia, document) is guarded so the
 * service is safe during SSR/prerender. The initial paint is handled by the
 * anti-flash inline script in index.html; this service keeps it in sync at runtime.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Tracks the OS-level `prefers-color-scheme: dark` state (browser only). */
  private readonly systemDark = signal(false);

  /** The user's selected theme mode. */
  readonly mode: WritableSignal<ThemeMode> = signal<ThemeMode>(this.readInitialMode());

  /** Concrete theme in effect right now. */
  readonly resolved: Signal<'light' | 'dark'> = computed(() => {
    const current = this.mode();
    if (current === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return current;
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const media = window.matchMedia(DARK_QUERY);
    this.systemDark.set(media.matches);
    media.addEventListener('change', (event) => this.systemDark.set(event.matches));

    effect(() => {
      const isDark = this.resolved() === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    });
  }

  /** Update the active mode and persist it. */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* Storage unavailable (private mode / disabled) — keep in-memory state. */
    }
  }

  private readInitialMode(): ThemeMode {
    if (!this.isBrowser) {
      return 'system';
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      /* Ignore and fall back to system. */
    }
    return 'system';
  }
}
