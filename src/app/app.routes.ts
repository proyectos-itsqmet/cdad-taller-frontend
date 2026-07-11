import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ---- Public pages (no shell) ----
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'centro-de-ayuda',
    loadComponent: () => import('./pages/help-center/help-center').then((m) => m.HelpCenter),
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },

  // ---- App pages (inside the shell) ----
  {
    path: '',
    component: AppShell,
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'archivos', pathMatch: 'full' },
      { path: 'home', redirectTo: 'archivos', pathMatch: 'full' },
      {
        path: 'archivos',
        loadComponent: () => import('./pages/files/files').then((m) => m.Files),
      },
      {
        path: 'archivos/:folderId',
        loadComponent: () => import('./pages/files/files').then((m) => m.Files),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
        children: [
          { path: '', redirectTo: 'cuenta', pathMatch: 'full' },
          {
            path: 'cuenta',
            loadComponent: () => import('./pages/settings/account/account').then((m) => m.Account),
          },
          {
            path: 'tema',
            loadComponent: () => import('./pages/settings/appearance/appearance').then((m) => m.Appearance),
          },
        ],
      },
    ],
  },

  // ---- Fallback ----
  { path: '**', redirectTo: '' },
];
