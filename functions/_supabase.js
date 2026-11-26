import { CATALOGO } from "./_catalogo.js";

const norm = (s) => (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function sb(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const base = env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/";
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
  };
  return async function req(path, { method = "GET", body, prefer } = {}) {
    const r = await fetch(base + path, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]}: ${r.status} ${await r.text()}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  };
}

// Une el catálogo con los productos del CRM (precio y stock reales).
export async function catalogoConCRM(env) {
  const req = sb(env);
  const prods = await req("products?select=id,code,name,price,stock");
  return CATALOGO.map((c) => {
    const p =
      (c.codigo && prods.find((x) => norm(x.code) === norm(c.codigo))) ||
      prods.find((x) => norm(x.name) === norm(c.nombre));
    return {
      id: c.id,
      nombre: c.nombre,
      img: c.img,
      tag: c.tag || null,
      precio: p && Number(p.price) > 0 ? Number(p.price) : c.precio,
      stock: p ? Number(p.stock) : null,
      crmId: p ? p.id : null,
    };
  });
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
