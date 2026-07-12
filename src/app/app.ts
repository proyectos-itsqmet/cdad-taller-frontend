import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  // Instantiating ThemeService here activates its app-wide effect that keeps the
  // `dark` class on <html> in sync with the resolved theme.
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    const platformId = inject(PLATFORM_ID);
    
    if (isPlatformBrowser(platformId)) {
      this.auth.validate().subscribe({
        next: () => console.log('Sesión validada exitosamente al cargar la app.'),
        error: () => {
          const publicRoutes = ['/', '/login', '/registro', '/contacto', '/centro-de-ayuda', '/sobre-nosotros'];
          const currentUrl = this.router.url.split('?')[0]; 
          
          if (!publicRoutes.includes(currentUrl)) {
            this.router.navigate(['/']);
          }
        }
      });
    }
  }
}
