/**
 * Development config, used by `ng serve`.
 *
 * Both services run on their own port here, so every API call is cross-origin
 * and the `jwt` cookie only travels because `apiInterceptor` adds
 * `withCredentials` for these two origins. In production nginx collapses them
 * into one origin — see environment.prod.ts.
 */
export const environment = {
  production: false,
  /** Spring Boot backend. */
  apiBaseUrl: 'http://localhost:8080',
  /** kubo-analytics (Python / FastAPI). */
  analyticsBaseUrl: 'http://localhost:8000',
};
