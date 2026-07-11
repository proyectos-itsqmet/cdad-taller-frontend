import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Authenticated route with a dynamic param: rendered per-request (its data
  // is loaded client-side after auth, so there is nothing to prerender).
  {
    path: 'archivos/:folderId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
