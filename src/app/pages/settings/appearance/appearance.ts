import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideGrid2x2,
  lucideGrid3x3,
  lucideList,
  lucideMonitor,
  lucideMoon,
  lucideSun,
} from '@ng-icons/lucide';
import { ThemeMode, ViewMode } from '../../../core/models/models';
import { ThemeService } from '../../../core/theme/theme.service';

type Density = 'comodo' | 'compacto';

interface ThemeOption {
  mode: ThemeMode;
  icon: string;
  label: string;
  desc: string;
}

interface ViewOption {
  mode: ViewMode;
  icon: string;
  label: string;
}

const VIEW_KEY = 'kubo-view';
const DENSITY_KEY = 'kubo-density';
const MOTION_KEY = 'kubo-reduce-motion';

/**
 * Appearance — "Tema". This page is FUNCTIONAL: the theme selector is wired to
 * ThemeService, and the default view / density / reduce-motion preferences are
 * persisted to localStorage (SSR-guarded). Everything reacts instantly.
 */
@Component({
  selector: 'kubo-settings-appearance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideGrid2x2,
      lucideGrid3x3,
      lucideList,
      lucideCheck,
    }),
  ],
  host: { class: 'block' },
  templateUrl: './appearance.html',
})
export class Appearance {
  protected readonly theme = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly viewMode = signal<ViewMode>('grid-large');
  protected readonly density = signal<Density>('comodo');
  protected readonly reduceMotion = signal(false);

  protected readonly themeOptions: readonly ThemeOption[] = [
    { mode: 'light', icon: 'lucideSun', label: 'Claro', desc: 'Ideal para ambientes luminosos.' },
    { mode: 'dark', icon: 'lucideMoon', label: 'Oscuro', desc: 'Menos brillo, cómodo de noche.' },
    { mode: 'system', icon: 'lucideMonitor', label: 'Sistema', desc: 'Sigue el ajuste del equipo.' },
  ];

  protected readonly viewOptions: readonly ViewOption[] = [
    { mode: 'grid-large', icon: 'lucideGrid2x2', label: 'Cuadrícula grande' },
    { mode: 'grid-small', icon: 'lucideGrid3x3', label: 'Cuadrícula pequeña' },
    { mode: 'list', icon: 'lucideList', label: 'Lista' },
  ];

  constructor() {
    // Browser-only: hydrate persisted preferences. Guarded for SSR/zoneless.
    if (!this.isBrowser) {
      return;
    }
    const v = this.read(VIEW_KEY);
    if (v === 'grid-large' || v === 'grid-small' || v === 'list') {
      this.viewMode.set(v);
    }
    const d = this.read(DENSITY_KEY);
    if (d === 'comodo' || d === 'compacto') {
      this.density.set(d);
    }
    if (this.read(MOTION_KEY) === '1') {
      this.reduceMotion.set(true);
    }
  }

  protected setTheme(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }

  protected setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.write(VIEW_KEY, mode);
  }

  protected setDensity(density: Density): void {
    this.density.set(density);
    this.write(DENSITY_KEY, density);
  }

  protected toggleMotion(): void {
    const next = !this.reduceMotion();
    this.reduceMotion.set(next);
    this.write(MOTION_KEY, next ? '1' : '0');
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Storage unavailable — keep in-memory state. */
    }
  }
}
