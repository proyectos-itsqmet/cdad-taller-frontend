# CdadTallerFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.18.

## Backend / API configuration

The frontend talks to the KuboDrive Spring Boot backend. The backend base URL is
defined in the environment files under `src/environments/`:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080', // <-- point this at your backend
};
```

To connect the app to a different backend, edit `apiBaseUrl` in
`src/environments/environment.ts`. This is the file used by **both** the
development and production builds today, so changing it here is enough to
repoint every build.

> **Note:** `apiBaseUrl` is the origin only (scheme + host + port), with **no**
> trailing slash and **no** `/api` suffix — the API paths (`/auth/...`,
> `/api/files/...`, `/api/folders/...`) are appended by the services.

### Optional: a separate production URL

`src/environments/environment.prod.ts` exists but is **not** used yet, because
`angular.json` has no `fileReplacements` for the production configuration. To
make the production build use its own URL, add this to the `production`
configuration of the `build` target in `angular.json`:

```jsonc
"production": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ],
  // ...existing budgets/outputHashing...
}
```

Then set the deployed backend URL in `src/environments/environment.prod.ts`.

### Authentication note

Auth uses an **HttpOnly cookie** (`jwt`), not a bearer token. All API requests
are sent with `withCredentials: true` (see `src/app/core/http/api.interceptor.ts`),
so the backend's CORS config must allow credentials and the frontend origin
(`http://localhost:4200` in development). Requests to the pre-signed MinIO
upload/download URLs are intentionally sent **without** credentials.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
