import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBox,
  lucideCircleHelp,
  lucideHardDrive,
  lucideLogOut,
  lucideMenu,
  lucideSearch,
  lucideSettings,
  lucideUser,
  lucideX,
} from '@ng-icons/lucide';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeToggle } from '../../shared/ui/theme-toggle/theme-toggle';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

/**
 * AppShell — authenticated app chrome: collapsible sidebar, sticky topbar, main outlet.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, UserAvatar, ThemeToggle],
  providers: [
    provideIcons({
      lucideBox,
      lucideHardDrive,
      lucideSettings,
      lucideMenu,
      lucideSearch,
      lucideCircleHelp,
      lucideUser,
      lucideLogOut,
      lucideX,
    }),
  ],
  host: {
    class: 'block',
    '(document:click)': 'closeUserMenu()',
    '(document:keydown.escape)': 'closeMenus()',
  },
  templateUrl: './app-shell.html',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.currentUser;

  protected readonly sidebarOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navLinks: readonly NavLink[] = [
    { path: '/archivos', label: 'Mi unidad', icon: 'lucideHardDrive' },
  ];

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected closeMenus(): void {
    this.sidebarOpen.set(false);
    this.userMenuOpen.set(false);
  }

  /** Logs out and returns to the login page. */
  protected async logout(): Promise<void> {
    this.closeUserMenu();
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
