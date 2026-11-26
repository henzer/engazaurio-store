// Catálogo de la tienda. El precio y el stock salen del CRM (tabla products),
// buscando por `codigo` si lo pones, o por nombre si no.
// `precio` aquí solo se usa si el CRM no responde o no encuentra el producto.
export const CATALOGO = [
  { id: "excavadora-mediana", nombre: "Excavadora mediana", codigo: "", precio: 550, img: "img/excavadora-mediana.jpg", tag: "Más vendida" },
  { id: "excavadora-pequena", nombre: "Excavadora pequeña", codigo: "", precio: 300, img: "img/excavadora-pequena.jpg" },
  { id: "camion-volteo",      nombre: "Camión de volteo",   codigo: "", precio: null, img: "img/camion-volteo.jpg" },
  { id: "cargador-frontal",   nombre: "Cargador frontal",   codigo: "", precio: null, img: "img/cargador-frontal.jpg" },
  { id: "grua",               nombre: "Grúa",               codigo: "", precio: null, img: "img/grua.jpg" },
];

// Black Friday: se ordenan las unidades de mayor a menor precio y, en cada pareja,
// la más barata va a mitad de precio.
export const PROMO_ACTIVA = true;
export const CANAL_WEB = "Tienda web";
