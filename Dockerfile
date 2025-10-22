# Multi-stage build para producción optimizada

# ======================================
# Stage 1: Build
# ======================================
FROM node:18-alpine as builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (mejor cache)
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build argument para API URL (se puede pasar en build time)
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB195XyO5y089iC-

# Configurar variables de entorno para build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Build de producción con Vite
RUN npm run build

# ======================================
# Stage 2: Producción con Nginx
# ======================================
FROM nginx:alpine

# Copiar configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos build desde el stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear un script para reemplazar variables de entorno en runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "🔄 Configurando variables de entorno..."' >> /docker-entrypoint.sh && \
    echo 'echo "✅ Frontend listo"' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Exponer puerto HTTP
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Ejecutar Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
