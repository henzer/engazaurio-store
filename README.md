# Engazaurio · Tienda web

Tienda de engazaurio.com. Página estática en Cloudflare Pages, con dos funciones
que se conectan al CRM (Supabase de engazaurio-app):

- `GET /api/products`: precio y stock reales desde la tabla `products`.
- `POST /api/orders`: guarda el pedido como orden "creado", canal "Tienda web",
  crea o reutiliza el cliente por teléfono y descuenta el stock. Después el cliente
  envía el pedido por WhatsApp con el número de orden.

Oferta Black Friday (2do a mitad de precio, el de menor precio) se calcula en la
página y se vuelve a calcular en el servidor. Se apaga con `PROMO_ACTIVE = false`
en `functions/_catalog.js` y en `public/index.html`.

## Estructura
- `public/`: la página (index.html e imágenes).
- `functions/`: funciones de Cloudflare. `_catalog.js` lista los productos de la tienda.
- `supabase/security.sql`: reglas para cerrar el acceso público a la base de datos.

## Puesta en marcha (una sola vez)

### 1. Supabase
1. SQL Editor: pegar `supabase/security.sql` y Run.
2. Authentication > Sign In / Providers: desactivar "Allow new users to sign up".
3. Project Settings > API Keys: copiar la clave secreta (`sb_secret_...`, o la `service_role` en "Legacy API keys"). La URL es `https://<project-id>.supabase.co`.

### 2. Cloudflare Pages
1. Workers & Pages > Create > Pages > Connect to Git > `henzer/engazaurio-store`.
2. Framework: None. Build command: vacío. Build output directory: `public`.
3. Settings > Variables and Secrets (Production):
   - `SUPABASE_URL` = URL del proyecto
   - `SUPABASE_SERVICE_ROLE_KEY` = clave secreta `sb_secret_...` o `service_role` (tipo "Secret")
4. Volver a publicar (Deployments > Retry) para que tome las variables.

### 3. Dominio (GoDaddy)
1. Cloudflare > Add a domain > engazaurio.com (plan Free). Cloudflare muestra 2 nameservers.
2. GoDaddy > Mis productos > engazaurio.com > DNS > Nameservers > Cambiar >
   "Usaré mis propios servidores de nombres" > pegar los 2 de Cloudflare.
3. Cuando Cloudflare marque el dominio como activo: proyecto de Pages >
   Custom domains > agregar `engazaurio.com` y `www.engazaurio.com`.

## Protección contra bots
Ya incluido en el código: campo oculto (honeypot), máximo 10 unidades por pedido y
máximo 3 pedidos por teléfono por hora (`MAX_ORDERS_PER_PHONE` en
`functions/api/orders.js`; si se pasa, responde 429).

Cloudflare Turnstile (verificación "no soy robot", casi siempre invisible). Se activa
solo cuando existen las dos variables; sin ellas la tienda funciona igual que antes.
1. Cloudflare > Turnstile > Add widget. Hostnames: `engazaurio-store.pages.dev`,
   `engazaurio.com`, `www.engazaurio.com`. Widget mode: Managed.
2. Pages > Settings > Variables and Secrets (Production):
   - `TURNSTILE_SITE_KEY` = Site Key (tipo "Text")
   - `TURNSTILE_SECRET_KEY` = Secret Key (tipo "Secret")
3. Deployments > Retry deployment.

Cuando el dominio esté en Cloudflare, agregar también una regla en Security > WAF >
Rate limiting rules: URI Path igual a `/api/orders`, por ejemplo 5 solicitudes por
minuto por IP, acción Block.

## Productos
El precio y el stock vienen del CRM. Cada producto de `functions/_catalog.js` se
busca por `code` (si se llena) o por nombre. Para agregar un juguete: subir su
foto a `public/img/` (nombre del archivo en inglés), agregarlo a `_catalog.js` y a la lista de respaldo en
`public/index.html`.

## Convención
Todo el código va en inglés: nombres de archivos, variables, funciones, ids y
comentarios. Solo el texto que ve el cliente (y los valores que deben coincidir
con el CRM, como el estado "creado" y el canal "Tienda web") va en español.
