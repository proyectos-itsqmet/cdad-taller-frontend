/**
 * Production config, used by `ng build` via the `fileReplacements` entry in
 * angular.json. (Until that entry existed this file was dead code — the app
 * always shipped the dev config.)
 *
 * Both base URLs are EMPTY on purpose. In the containerized deployment nginx
 * is the single entry point, so `/api/...` and `/analytics/...` are same-origin
 * paths on whatever host the user typed. Three things fall out of that:
 *
 *   1. The browser sends the `jwt` cookie by itself — same-origin requests
 *      carry cookies with no `withCredentials` needed.
 *   2. CORS never enters the picture, so the backend's `cors.allowed-origin`
 *      stops being a thing that can break the deploy.
 *   3. The app works on any hostname (localhost, a LAN IP, a Tailscale name)
 *      without a rebuild — nothing here hardcodes one.
 *
 * The tempting mistake is to put `http://backend:8080` here. Don't: `backend`
 * is a Docker-network hostname, and the browser runs outside that network.
 */
export const environment = {
  production: true,
  apiBaseUrl: '',
  analyticsBaseUrl: '',
};
