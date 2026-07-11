import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideUser } from '@ng-icons/lucide';

interface SettingsTab {
  /** Route relative to the `configuracion` parent. */
  path: string;
  label: string;
  icon: string;
}

/**
 * Settings — the settings sub-shell. Renders the page title, a secondary nav
 * (vertical side tabs on lg, horizontally-scrollable segmented tabs on mobile)
 * and a `<router-outlet/>` for the two child sections (Cuenta, Tema).
 *
 * Lives inside the AppShell outlet, so it owns only its own content column.
 */
@Component({
  selector: 'kubo-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  providers: [provideIcons({ lucideUser, lucideSun })],
  host: { class: 'block' },
  templateUrl: './settings.html',
})
export class Settings {
  /** Colour set applied to the active tab (kept separate so it wins reliably). */
  protected readonly activeClass = 'bg-brand text-brand-fg shadow-sm';
  /** Colour set applied to idle tabs. */
  protected readonly idleClass =
    'text-muted-foreground hover:bg-surface-muted hover:text-foreground';

  protected readonly tabs: readonly SettingsTab[] = [
    { path: './cuenta', label: 'Cuenta', icon: 'lucideUser' },
    { path: './tema', label: 'Tema', icon: 'lucideSun' },
  ];
}
