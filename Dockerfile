# ---------------------------------------------------------------------------
# Build stage. `ng build` runs with the production configuration (it is the
# default in angular.json), which means environment.prod.ts is swapped in via
# fileReplacements and the static routes are prerendered.
#
# Prerendering works offline: every data load in the app goes through
# `httpResource`, which returns undefined on the server, and authGuard
# short-circuits to true there. No backend is needed at build time.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime stage. This app is SSR (angular.json sets outputMode: "server"), so
# it is a Node process, not a folder of static files. express, @angular/ssr and
# @angular/platform-server are all runtime dependencies — hence a prod-only
# install here rather than copying the builder's node_modules (which carries
# the whole Angular CLI).
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4000
CMD ["node", "dist/cdad-taller-frontend/server/server.mjs"]
