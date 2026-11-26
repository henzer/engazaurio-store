import { catalogWithCRM, json } from "../_supabase.js";

// GET /api/products -> catalog with CRM price and stock (no costs or internal data)
export async function onRequestGet({ env }) {
  try {
    const list = await catalogWithCRM(env);
    return json(list.map(({ crmId, ...publicFields }) => publicFields));
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo leer el catálogo" }, 502);
  }
}
