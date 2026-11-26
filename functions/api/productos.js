import { catalogoConCRM, json } from "../_supabase.js";

// GET /api/productos -> catálogo con precio y stock del CRM (sin costos ni datos internos)
export async function onRequestGet({ env }) {
  try {
    const lista = await catalogoConCRM(env);
    return json(lista.map(({ crmId, ...pub }) => pub));
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo leer el catálogo" }, 502);
  }
}
