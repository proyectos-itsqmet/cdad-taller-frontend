import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The base project ships without zone.js (no polyfill wired in angular.json),
    // so change detection is zoneless and driven entirely by signals.
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 5 minutes; revisiting a cached folder is instant.
            staleTime: 5 * 60 * 1000,
            // Keep unused cache entries for 10 minutes before garbage collection.
            gcTime: 10 * 60 * 1000,
          },
        },
      }),
    ),
  ],
};
