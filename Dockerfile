# syntax=docker/dockerfile:1

##########
# Compilacion de la app Angular

FROM node:22-alpine AS builder

# Crear directorio app
WORKDIR /app

# Copiar manifiestos y cachear dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (incluye devDependencies para compilar)
RUN --mount=type=cache,target=/root/.npm npm ci

# Copiar el codigo fuente
COPY . .

# Compilar en produccion -> genera dist/cdad-taller-frontend
RUN npm run build

##########
# Imagen de runtime (servidor Node + SSR)

FROM node:22-alpine AS runtime

# Entorno de produccion y puerto
ENV NODE_ENV=production
ENV PORT=4000

# Crear directorio app
WORKDIR /app

# Copiar solo el build (server.mjs ya trae Express empaquetado, sin node_modules)
COPY --from=builder --chown=node:node /app/dist/cdad-taller-frontend ./

# Ejecutar como usuario sin privilegios
USER node

# Asignar puerto
EXPOSE 4000

# Chequeo de salud contra un estatico liviano
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/favicon.ico" > /dev/null 2>&1 || exit 1

# Arrancar el servidor SSR
CMD ["node", "server/server.mjs"]
