import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';
import { authGuard } from './core/auth/auth.guard';
import { pendingUploadGuard } from './core/files/upload.guard';

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
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        canDeactivate: [pendingUploadGuard],
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'archivos',
        canDeactivate: [pendingUploadGuard],
        loadComponent: () => import('./pages/files/files').then((m) => m.Files),
      },
      {
        path: 'archivos/:folderId',
        canDeactivate: [pendingUploadGuard],
        loadComponent: () => import('./pages/files/files').then((m) => m.Files),
      },
      {
        path: 'compartidos',
        redirectTo: 'compartidos/conmigo',
        pathMatch: 'full',
      },
      {
        path: 'compartidos/:type',
        loadComponent: () => import('./pages/shared-with-me/shared-with-me').then((m) => m.SharedWithMe),
      },
      {
        path: 'recientes',
        loadComponent: () => import('./pages/recent/recent').then((m) => m.Recent),
      },
      {
        path: 'destacados',
        loadComponent: () => import('./pages/starred/starred').then((m) => m.Starred),
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
          {
            path: 'carpetas',
            loadComponent: () => import('./pages/settings/folders/folders').then((m) => m.FoldersSettings),
          },
          {
            path: 'actividad',
            loadComponent: () => import('./pages/settings/activity/activity').then((m) => m.Activity),
          },
        ],
      },
    ],
  },

  // ---- Fallback ----
  { path: '**', redirectTo: '' },
];
