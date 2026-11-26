import { catalogWithCRM, supabase, json } from "../_supabase.js";
import { PROMO_ACTIVE, WEB_CHANNEL } from "../_catalog.js";

// Status value used by the CRM for new orders (data value, must match the CRM).
const STATUS_CREATED = "creado";

const clean = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");

// POST /api/orders -> saves the order in the CRM with status "creado".
// Prices and the discount are recalculated here; what the browser sends is not trusted.
// Error messages are shown to customers, so they stay in Spanish.
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Pedido inválido" }, 400); }

  if (body.website) return json({ ok: true }); // honeypot for bots

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 20).replace(/[^\d+]/g, "");
  const address = clean(body.address, 200);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 8)
    return json({ error: "Escribe tu nombre y un teléfono válido" }, 400);

  const requested = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
  if (!requested.length) return json({ error: "El carrito está vacío" }, 400);

  try {
    const db = supabase(env);
    const catalog = await catalogWithCRM(env);

    // Valid units, with CRM price
    const units = [];
    for (const it of requested) {
      const product = catalog.find((c) => c.id === it.id);
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 0), 10);
      if (!product || !qty || !product.price || !product.crmId) continue;
      if (product.stock !== null && product.stock < qty) return json({ error: `No hay suficientes ${product.name}` }, 409);
      for (let i = 0; i < qty; i++) units.push(product);
    }
    if (!units.length) return json({ error: "Ningún producto disponible" }, 400);

    // Black Friday discount per product
    units.sort((a, b) => b.price - a.price);
    const lines = new Map();
    units.forEach((p, i) => {
      const line = lines.get(p.id) || { product: p, qty: 0, discount: 0 };
      line.qty += 1;
      if (PROMO_ACTIVE && i % 2 === 1) line.discount += p.price / 2;
      lines.set(p.id, line);
    });
    const subtotal = units.reduce((s, p) => s + p.price, 0);
    const discount = [...lines.values()].reduce((s, l) => s + l.discount, 0);

    // Web store channel
    let [channel] = await db(`channels?select=id&name=eq.${encodeURIComponent(WEB_CHANNEL)}&limit=1`);
    if (!channel) [channel] = await db("channels", { method: "POST", body: { name: WEB_CHANNEL }, prefer: "return=representation" });

    // Customer: reused if that phone already exists
    let [customer] = await db(`customers?select=id&phone=eq.${encodeURIComponent(phone)}&limit=1`);
    if (!customer)
      [customer] = await db("customers", { method: "POST", body: { name, phone, address: address || null }, prefer: "return=representation" });

    // Order + items (discount as a percentage, same as the CRM)
    const [order] = await db("orders", {
      method: "POST",
      body: { customer_id: customer.id, channel_id: channel.id, status: STATUS_CREATED },
      prefer: "return=representation",
    });
    await db("order_items", {
      method: "POST",
      body: [...lines.values()].map((l) => ({
        order_id: order.id,
        product_id: l.product.crmId,
        quantity: l.qty,
        discount: l.discount ? Math.round((l.discount / (l.product.price * l.qty)) * 10000) / 100 : 0,
      })),
    });

    // Decrease stock, same as creating a sale in the CRM
    for (const l of lines.values()) {
      if (l.product.stock === null) continue;
      await db(`products?id=eq.${l.product.crmId}`, { method: "PATCH", body: { stock: l.product.stock - l.qty } });
    }

    return json({ ok: true, order: order.id.slice(0, 8).toUpperCase(), subtotal, discount, total: subtotal - discount });
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo guardar el pedido" }, 502);
  }
}
