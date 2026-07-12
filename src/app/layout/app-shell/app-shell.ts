import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBox,
  lucideCircleHelp,
  lucideClock,
  lucideHardDrive,
  lucideHouse,
  lucideLogOut,
  lucideMenu,
  lucideSearch,
  lucideSettings,
  lucideShare2,
  lucideStar,
  lucideUpload,
  lucideUser,
  lucideX,
} from '@ng-icons/lucide';
import { DataService } from '../../core/data/data.service';
import { StorageMeter } from '../../shared/ui/storage-meter/storage-meter';
import { ThemeToggle } from '../../shared/ui/theme-toggle/theme-toggle';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';
import { AuthService } from '../../core/auth/auth.service';

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
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    StorageMeter,
    UserAvatar,
    ThemeToggle,
  ],
  providers: [
    provideIcons({
      lucideBox,
      lucideUpload,
      lucideHouse,
      lucideHardDrive,
      lucideShare2,
      lucideClock,
      lucideStar,
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
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);

  protected readonly authUser = this.auth.currentUser;

  protected readonly displayUser = computed(() => {
    const u = this.authUser();
    if (!u) {
      return {
        id: '',
        email: '',
        name: '?',
        avatarColor: '#2563eb',
        createdAt: '',
        storageQuotaBytes: 0,
      };
    }
    return {
      id: '',
      email: u.email,
      name: `${u.firstName} ${u.lastName}`.trim(),
      avatarColor: '#2563eb',
      createdAt: '',
      storageQuotaBytes: 0,
    };
  });

  protected readonly sidebarOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navLinks: readonly NavLink[] = [
    { path: '/home', label: 'Inicio', icon: 'lucideHouse' },
    { path: '/archivos', label: 'Mi unidad', icon: 'lucideHardDrive' },
    { path: '/compartidos', label: 'Compartido conmigo', icon: 'lucideShare2' },
    { path: '/recientes', label: 'Recientes', icon: 'lucideClock' },
    { path: '/destacados', label: 'Destacados', icon: 'lucideStar' },
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
}
