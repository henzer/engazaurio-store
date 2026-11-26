# Engazaurio · Tienda web

Tienda de engazaurio.com. Página estática en Cloudflare Pages, con dos funciones
que se conectan al CRM (Supabase de engazaurio-app):

- `GET /api/productos`: precio y stock reales desde la tabla `products`.
- `POST /api/pedido`: guarda el pedido como orden "creado", canal "Tienda web",
  crea o reutiliza el cliente por teléfono y descuenta el stock. Después el cliente
  envía el pedido por WhatsApp con el número de orden.

Oferta Black Friday (2do a mitad de precio, el de menor precio) se calcula en la
página y se vuelve a calcular en el servidor. Se apaga con `PROMO_ACTIVA = false`
en `functions/_catalogo.js` y en `public/index.html`.

## Estructura
- `public/`: la página (index.html e imágenes).
- `functions/`: funciones de Cloudflare. `_catalogo.js` lista los productos de la tienda.
- `supabase/seguridad.sql`: reglas para cerrar el acceso público a la base de datos.

## Puesta en marcha (una sola vez)

### 1. Supabase
1. SQL Editor: pegar `supabase/seguridad.sql` y Run.
2. Authentication > Sign In / Providers: desactivar "Allow new users to sign up".
3. Project Settings > API: copiar la URL del proyecto y la clave `service_role` (secreta).

### 2. Cloudflare Pages
1. Workers & Pages > Create > Pages > Connect to Git > `henzer/engazaurio-store`.
2. Framework: None. Build command: vacío. Build output directory: `public`.
3. Settings > Variables and Secrets (Production):
   - `SUPABASE_URL` = URL del proyecto
   - `SUPABASE_SERVICE_ROLE_KEY` = clave service_role (tipo "Secret")
4. Volver a publicar (Deployments > Retry) para que tome las variables.

### 3. Dominio (GoDaddy)
1. Cloudflare > Add a domain > engazaurio.com (plan Free). Cloudflare muestra 2 nameservers.
2. GoDaddy > Mis productos > engazaurio.com > DNS > Nameservers > Cambiar >
   "Usaré mis propios servidores de nombres" > pegar los 2 de Cloudflare.
3. Cuando Cloudflare marque el dominio como activo: proyecto de Pages >
   Custom domains > agregar `engazaurio.com` y `www.engazaurio.com`.

## Productos
El precio y el stock vienen del CRM. Cada producto de `functions/_catalogo.js` se
busca por `codigo` (si se llena) o por nombre. Para agregar un juguete: subir su
foto a `public/img/`, agregarlo a `_catalogo.js` y a la lista de respaldo en
`public/index.html`.
