import { CATALOG } from "./_catalog.js";

const normalize = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function supabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const base = env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/";
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  // Legacy keys are JWTs and also go in Authorization. New sb_secret_ keys are
  // not JWTs, so they are sent only in the apikey header.
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key;
  return async function request(path, { method = "GET", body, prefer } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]}: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };
}

// Merges the catalog with the CRM products (real price and stock).
export async function catalogWithCRM(env) {
  const request = supabase(env);
  const products = await request("products?select=id,code,name,price,stock");
  return CATALOG.map((item) => {
    const match =
      (item.code && products.find((p) => normalize(p.code) === normalize(item.code))) ||
      products.find((p) => normalize(p.name) === normalize(item.name));
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      tag: item.tag || null,
      price: match && Number(match.price) > 0 ? Number(match.price) : item.price,
      stock: match ? Number(match.stock) : null,
      crmId: match ? match.id : null,
    };
  });
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
