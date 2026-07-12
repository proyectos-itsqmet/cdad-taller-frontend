import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Si ya tenemos los datos en memoria, permitimos el paso inmediatamente
  if (authService.currentUser()) {
    return true;
  }

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // 2. Si no están en memoria, validamos con el backend
  return authService.validate().pipe(
    map(() => true),
    catchError(() => {
      // Si falla la autenticación, limpiamos el estado
      authService.currentUser.set(null);
      
      // Limpiamos todas las cookies accesibles desde el navegador
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      // Redirigimos a la página de inicio
      router.navigate(['/']);
      return of(false);
    })
  );
};
