import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'archivos/:folderId',
    renderMode: RenderMode.Server
  },
  {
    path: 'compartidos/:type',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { type: 'conmigo' },
      { type: 'por-mi' }
    ]
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
