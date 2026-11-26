import { catalogoConCRM, sb, json } from "../_supabase.js";
import { PROMO_ACTIVA, CANAL_WEB } from "../_catalogo.js";

const limpiar = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");

// POST /api/pedido -> guarda el pedido como orden "creado" en el CRM.
// Los precios y el descuento se recalculan aquí; no se confía en lo que manda el navegador.
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Pedido inválido" }, 400); }

  if (body.website) return json({ ok: true }); // trampa para bots

  const nombre = limpiar(body.nombre, 80);
  const telefono = limpiar(body.telefono, 20).replace(/[^\d+]/g, "");
  const direccion = limpiar(body.direccion, 200);
  if (nombre.length < 2 || telefono.replace(/\D/g, "").length < 8)
    return json({ error: "Escribe tu nombre y un teléfono válido" }, 400);

  const pedidos = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
  if (!pedidos.length) return json({ error: "El carrito está vacío" }, 400);

  try {
    const req = sb(env);
    const catalogo = await catalogoConCRM(env);

    // Unidades válidas, con precio del CRM
    const unidades = [];
    for (const it of pedidos) {
      const prod = catalogo.find((c) => c.id === it.id);
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 0), 10);
      if (!prod || !qty || !prod.precio || !prod.crmId) continue;
      if (prod.stock !== null && prod.stock < qty) return json({ error: `No hay suficientes ${prod.nombre}` }, 409);
      for (let i = 0; i < qty; i++) unidades.push(prod);
    }
    if (!unidades.length) return json({ error: "Ningún producto disponible" }, 400);

    // Descuento Black Friday por producto
    unidades.sort((a, b) => b.precio - a.precio);
    const lineas = new Map();
    unidades.forEach((p, i) => {
      const l = lineas.get(p.id) || { prod: p, qty: 0, desc: 0 };
      l.qty += 1;
      if (PROMO_ACTIVA && i % 2 === 1) l.desc += p.precio / 2;
      lineas.set(p.id, l);
    });
    const subtotal = unidades.reduce((s, p) => s + p.precio, 0);
    const descuento = [...lineas.values()].reduce((s, l) => s + l.desc, 0);

    // Canal "Tienda web"
    let [canal] = await req(`channels?select=id&name=eq.${encodeURIComponent(CANAL_WEB)}&limit=1`);
    if (!canal) [canal] = await req("channels", { method: "POST", body: { name: CANAL_WEB }, prefer: "return=representation" });

    // Cliente: se reutiliza si ya existe ese teléfono
    let [cliente] = await req(`customers?select=id&phone=eq.${encodeURIComponent(telefono)}&limit=1`);
    if (!cliente)
      [cliente] = await req("customers", { method: "POST", body: { name: nombre, phone: telefono, address: direccion || null }, prefer: "return=representation" });

    // Orden + productos (descuento en %, igual que en el CRM)
    const [orden] = await req("orders", {
      method: "POST",
      body: { customer_id: cliente.id, channel_id: canal.id, status: "creado" },
      prefer: "return=representation",
    });
    await req("order_items", {
      method: "POST",
      body: [...lineas.values()].map((l) => ({
        order_id: orden.id,
        product_id: l.prod.crmId,
        quantity: l.qty,
        discount: l.desc ? Math.round((l.desc / (l.prod.precio * l.qty)) * 10000) / 100 : 0,
      })),
    });

    // Descontar stock, igual que cuando creas una venta en el CRM
    for (const l of lineas.values()) {
      if (l.prod.stock === null) continue;
      await req(`products?id=eq.${l.prod.crmId}`, { method: "PATCH", body: { stock: l.prod.stock - l.qty } });
    }

    return json({ ok: true, pedido: orden.id.slice(0, 8).toUpperCase(), subtotal, descuento, total: subtotal - descuento });
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo guardar el pedido" }, 502);
  }
}
