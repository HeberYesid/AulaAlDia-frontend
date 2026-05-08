# 🚀 Build y Deployment

## Build de Producción

```powershell
pnpm build
```

Genera la carpeta `dist/` con assets optimizados y tree-shaken por Vite.

### Output típico

```
dist/
├── index.html              # HTML con references a assets hasheados
├── assets/
│   ├── index-[hash].js     # Bundle JS principal
│   ├── index-[hash].css    # CSS combinado
│   └── vendor-[hash].js    # Dependencias (chunk separado)
└── favicon.svg
```

---

## Variables de Entorno

### Desarrollo (`.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB195XyO5y089iC-
VITE_SUPPORT_CONTACT_EMAIL=support@aulaaldia.com
```

### Producción (`.env.production`)

```env
VITE_API_BASE_URL=https://api.aulaaldia.com
VITE_GOOGLE_CLIENT_ID=tu-id.apps.googleusercontent.com
VITE_TURNSTILE_SITE_KEY=tu-key-de-produccion
VITE_SUPPORT_CONTACT_EMAIL=soporte@aulaaldia.com
```

> **Importante**: Las variables con prefijo `VITE_` se embeben en el bundle en build time. No son secrets — quedan expuestas en el client-side JS.

---

## Plataformas de Deployment

### 1. Vercel (Actual)

Configuración en `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Puntos clave**:
- **SPA rewrite**: Todas las rutas redirigen a `index.html` para que React Router las maneje
- **Security headers**: XSS protection, clickjacking prevention, MIME sniffing prevention
- Deploy automático en cada push a la rama principal

### 2. Nginx (Alternativa / Docker)

Configuración en `nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Assets estáticos — cache agresivo (1 año, immutable)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML — sin cache
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /index.html;
}
```

**Estrategia de cache**:
- Assets hasheados (`*.js`, `*.css`) → cache de 1 año (immutable porque el hash cambia)
- `index.html` → sin cache (siempre obtener la versión más reciente)

---

## Vite Config de Producción

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    warmup: {
      clientFiles: ['./src/App.jsx', './src/main.jsx', './src/components/Sidebar.jsx'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react',
              'react-big-calendar', 'date-fns', 'axios'],
    holdUntilCrawlEnd: false,
  },
})
```

**Optimizaciones**:
- `warmup.clientFiles`: Pre-transforma los módulos más críticos para HMR más rápido
- `optimizeDeps.include`: Pre-bundlea dependencias pesadas para evitar waterfalls en dev
- `holdUntilCrawlEnd: false`: No espera a escanear todo el proyecto antes de servir

---

## Checklist Pre-Deploy

```powershell
# 1. Lint limpio
pnpm lint

# 2. Tests pasan
pnpm test:run

# 3. Build exitoso (sin errores)
pnpm build

# 4. Preview local funciona
pnpm preview
# Verificar en http://localhost:4173

# 5. Variables de entorno de producción configuradas
# Verificar .env.production o env vars en Vercel
```

---

## Arquitectura de Deployment

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Desarrollador│     │   CI/CD      │     │  Producción   │
│              │     │              │     │              │
│  git push ──────▶  │  lint ───▶   │     │              │
│              │     │  test ───▶   │     │  Vercel CDN  │
│              │     │  build ──▶   │────▶│  (SPA)       │
│              │     │              │     │              │
│              │     │  Vercel      │     │  ┌────────┐  │
│              │     │  auto-deploy │     │  │ dist/  │  │
│              │     │              │     │  └────────┘  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  │ HTTPS
                                                  ▼
                                          ┌──────────────┐
                                          │  Backend API  │
                                          │  (Django)     │
                                          │  :8000        │
                                          └──────────────┘
```

---

## Security Headers

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME type sniffing |
| `X-Frame-Options` | `DENY` (Vercel) / `SAMEORIGIN` (Nginx) | Prevenir clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Filtro XSS del navegador |
| `Referrer-Policy` | `no-referrer-when-downgrade` | Controlar info de referrer |
| `Cache-Control` | Varía por tipo | Inmutable para assets, sin cache para HTML |
