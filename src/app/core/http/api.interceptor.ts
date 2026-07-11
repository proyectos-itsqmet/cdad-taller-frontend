import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const apiOrigin = new URL(environment.apiBaseUrl).origin;

/**
 * Attaches `withCredentials: true` only to requests whose ORIGIN matches the
 * backend API (`environment.apiBaseUrl`). The auth cookie (`jwt`) is HttpOnly
 * and can't be read from JS, so the browser must be told to send it explicitly.
 *
 * Matching by origin (not a string prefix) keeps the credential boundary tight:
 * requests to any other origin — most notably the pre-signed MinIO
 * `uploadUrl`/`downloadUrl` — are passed through untouched, since sending
 * credentials cross-origin to those URLs would break the signature/CORS
 * contract. Relative URLs (assets, etc.) fail `new URL()` and pass through.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let isApiRequest = false;
  try {
    isApiRequest = new URL(req.url).origin === apiOrigin;
  } catch {
    isApiRequest = false;
  }
  return isApiRequest ? next(req.clone({ withCredentials: true })) : next(req);
};
