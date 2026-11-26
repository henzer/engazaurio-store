// Store catalog. Price and stock come from the CRM (products table),
// matched by `code` if set, otherwise by name.
// `price` here is only used when the CRM does not respond or the product is not found.
// `name` and `tag` are shown to customers, so they stay in Spanish.
export const CATALOG = [
  { id: "large-excavator",  name: "Excavadora grande",  code: "DN599446", price: 730, img: "img/large-excavator.jpg" },
  { id: "medium-excavator", name: "Excavadora mediana", code: "", price: 550, img: "img/medium-excavator.jpg", tag: "Más vendida" },
  { id: "small-excavator",  name: "Excavadora pequeña", code: "", price: 300, img: "img/small-excavator.jpg" },
  { id: "dump-truck",       name: "Camión de volteo",   code: "", price: null, img: "img/dump-truck.jpg" },
  { id: "front-loader",     name: "Cargador frontal",   code: "", price: null, img: "img/front-loader.jpg" },
  { id: "crane",            name: "Grúa",               code: "", price: null, img: "img/crane.jpg" },
];

// Black Friday: units are sorted from highest to lowest price and, in each pair,
// the cheaper one is half price.
export const PROMO_ACTIVE = true;
// Name of the sales channel in the CRM (data value, must match the CRM).
export const WEB_CHANNEL = "Tienda web";
