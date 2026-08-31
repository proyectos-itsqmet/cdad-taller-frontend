import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/**
 * Origins that are allowed to receive the auth cookie: the Spring backend and
 * the Python analytics service.
 *
 * Empty base URLs are filtered out rather than parsed — in production both are
 * `''` (same-origin behind nginx), and `new URL('')` throws. That also means
 * production ends up with an empty set, which is correct: same-origin requests
 * carry cookies on their own and need no `withCredentials` at all.
 */
const credentialedOrigins = new Set(
  [environment.apiBaseUrl, environment.analyticsBaseUrl]
    .filter((base) => base !== '')
    .map((base) => new URL(base).origin),
);

/**
 * Attaches `withCredentials: true` only to requests aimed at our own services.
 * The auth cookie (`jwt`) is HttpOnly and can't be read from JS, so the browser
 * must be told explicitly to send it cross-origin.
 *
 * Matching by ORIGIN (not a string prefix) keeps the credential boundary tight:
 * requests to any other origin — most notably the pre-signed MinIO
 * `uploadUrl`/`downloadUrl` — are passed through untouched, since sending
 * credentials to those would break the signature/CORS contract.
 *
 * Relative URLs (`/api/files` in production, plus assets) fail `new URL()` and
 * pass through. That is the desired behaviour, not a gap: they are same-origin,
 * so the browser attaches the cookie itself.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let origin: string | null = null;
  try {
    origin = new URL(req.url).origin;
  } catch {
    origin = null;
  }

  return origin !== null && credentialedOrigins.has(origin)
    ? next(req.clone({ withCredentials: true }))
    : next(req);
};
