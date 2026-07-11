import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Guards the authenticated shell's children. On the server we let hydration
 * proceed unguarded (the server has no cookie to validate against on its own
 * outgoing requests); the browser re-checks the session right after and
 * redirects if it turns out to be invalid. On the browser, an already-known
 * session short-circuits, otherwise we hit `/auth/validate` before deciding.
 */
export const authGuard: CanActivateChildFn = async (): Promise<boolean | UrlTree> => {
  const platformId = inject(PLATFORM_ID);
  if (isPlatformServer(platformId)) return true;

  const authService = inject(AuthService);
  if (authService.isAuthenticated()) return true;

  const valid = await authService.validate();
  if (valid) return true;

  const router = inject(Router);
  return router.createUrlTree(['/login']);
};
