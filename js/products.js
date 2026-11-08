/* ==========================================================================
   products.js — sample product data + inline SVG artwork helpers
   All products, prices and ratings are SAMPLE demonstration content.
   ========================================================================== */

const PRODUCTS = [
  {
    id: 1,
    name: "Lay's Classic",
    short: ["CLASSIC"],
    category: "classic",
    price: 150,
    rating: 4.8,
    reviews: 248,
    badge: "Bestseller",
    desc: "Thin, golden and lightly salted — the original crunch.",
    long: "Our everyday favourite: thin-sliced, golden potato chips with a light sprinkle of salt. Simple, crispy and made for sharing.",
    notes: ["Lightly salted", "Extra crispy"],
    colors: { light: "#FFE55C", base: "#FFC800", deep: "#E31E24" }
  },
  {
    id: 2,
    name: "Lay's Salt & Vinegar",
    short: ["SALT &", "VINEGAR"],
    category: "tangy",
    price: 160,
    rating: 4.5,
    reviews: 132,
    badge: "",
    desc: "A sharp, tangy kick of vinegar balanced with a pinch of salt.",
    long: "Bold and zesty. A tangy vinegar tang meets crispy potato chips for a flavour that wakes up your taste buds.",
    notes: ["Tangy", "Zesty"],
    colors: { light: "#8CC3F5", base: "#3D8FE0", deep: "#1F5FAE" }
  },
  {
    id: 3,
    name: "Lay's Barbecue",
    short: ["BARBECUE"],
    category: "savory",
    price: 160,
    rating: 4.6,
    reviews: 187,
    badge: "Popular",
    desc: "Smoky, savoury barbecue seasoning on every crunchy slice.",
    long: "A smoky-sweet barbecue seasoning coats every chip. Perfect for movie nights, picnics and game days.",
    notes: ["Smoky", "Savoury"],
    colors: { light: "#EE7B52", base: "#C2411F", deep: "#7E1F0B" }
  },
  {
    id: 4,
    name: "Lay's Sour Cream & Onion",
    short: ["SOUR CREAM", "& ONION"],
    category: "creamy",
    price: 170,
    rating: 4.7,
    reviews: 164,
    badge: "",
    desc: "Cool, creamy and herby with a mellow onion finish.",
    long: "Smooth sour cream flavour with a savoury onion twist. Cool, creamy and wonderfully moreish.",
    notes: ["Creamy", "Herby"],
    colors: { light: "#8EDB97", base: "#46AE55", deep: "#1F7430" }
  },
  {
    id: 5,
    name: "Lay's Masala",
    short: ["MASALA"],
    category: "spicy",
    price: 150,
    oldPrice: 180,
    rating: 4.9,
    reviews: 301,
    badge: "Sale",
    desc: "A bold desi-spice blend with a warm, zesty kick.",
    long: "A vibrant blend of warm spices with a zesty finish — a flavour made for those who love a little heat.",
    notes: ["Spicy", "Bold"],
    colors: { light: "#FFB04D", base: "#F2850C", deep: "#B3261E" }
  },
  {
    id: 6,
    name: "Lay's Cheese",
    short: ["CHEESE"],
    category: "creamy",
    price: 180,
    oldPrice: 210,
    rating: 4.6,
    reviews: 119,
    badge: "Sale",
    desc: "Rich, melty cheese flavour in every golden crunch.",
    long: "Cheesy, savoury and irresistibly golden. A rich cheese seasoning that pairs perfectly with a good conversation.",
    notes: ["Cheesy", "Rich"],
    colors: { light: "#FFDB6E", base: "#FFB81C", deep: "#D97A00" }
  }
];

const BUNDLES = [
  {
    id: 101,
    name: "Party Share Box",
    price: 799,
    oldPrice: 940,
    includes: [1, 2, 3, 4, 5, 6],
    desc: "All six flavours in one box — made for sharing.",
    tag: "Save 15%"
  },
  {
    id: 102,
    name: "Movie Night Duo",
    price: 260,
    oldPrice: 310,
    includes: [1, 3],
    desc: "Classic + Barbecue: the perfect couch companions.",
    tag: "Save 16%"
  },
  {
    id: 103,
    name: "Spice Lovers Trio",
    price: 430,
    oldPrice: 490,
    includes: [5, 3, 6],
    desc: "Masala, Barbecue and Cheese for bold snackers.",
    tag: "Save 12%"
  }
];

const ALL_ITEMS = PRODUCTS.concat(BUNDLES);

function findItem(id) {
  return ALL_ITEMS.find((i) => i.id === id);
}

/* ---------- Helpers ---------- */

function formatPrice(n) {
  return "Rs. " + Number(n).toLocaleString("en-PK");
}

function starsHTML(rating) {
  let out = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) out += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
    else if (rating >= i - 0.5) out += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
    else out += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
  }
  return out;
}

/* ---------- Inline SVG artwork (original illustrations, no external images) ---------- */

let _svgUid = 0;

function bagSVG(p) {
  const id = "bag" + ++_svgUid;
  const c = p.colors;
  let crimps = "";
  for (let x = 24; x <= 176; x += 6) {
    crimps += `<line x1="${x}" y1="20" x2="${x}" y2="36"/><line x1="${x}" y1="226" x2="${x}" y2="240"/>`;
  }
  const lines = p.short;
  const labelY = lines.length === 1 ? 172 : 163;
  const label = lines
    .map((t, i) => `<text x="100" y="${labelY + i * 19}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="${t.length > 9 ? 14 : 17}" fill="#fff" letter-spacing="1">${t.replace("&", "&amp;")}</text>`)
    .join("");
  return `<svg class="bag-svg" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of a ${p.name} sample chips pack">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.light}"/><stop offset="1" stop-color="${c.base}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".28" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <clipPath id="${id}c"><path d="M20 24 Q100 14 180 24 Q193 130 180 238 Q100 247 20 238 Q7 130 20 24Z"/></clipPath>
  </defs>
  <ellipse cx="100" cy="253" rx="68" ry="5" fill="#000" opacity=".12"/>
  <g clip-path="url(#${id}c)">
    <rect x="0" y="0" width="200" height="260" fill="url(#${id}g)"/>
    <path d="M-10 142 Q100 96 210 142 L210 198 Q100 152 -10 198Z" fill="${c.deep}"/>
    <circle cx="165" cy="70" r="26" fill="#fff" opacity=".12"/>
    <circle cx="36" cy="120" r="14" fill="#fff" opacity=".1"/>
    <g stroke="#000" stroke-opacity=".14" stroke-width="2.2">${crimps}</g>
    <rect x="0" y="0" width="200" height="260" fill="url(#${id}s)"/>
  </g>
  <rect x="50" y="52" width="100" height="40" rx="20" fill="#fff"/>
  <text x="100" y="80" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-style="italic" font-size="25" fill="#E31E24">Lay's</text>
  ${label}
  <text x="100" y="224" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="600" font-size="7.5" fill="#fff" opacity=".85" letter-spacing="1.4">SAMPLE ILLUSTRATION</text>
</svg>`;
}

function chipSVG() {
  const id = "chip" + ++_svgUid;
  return `<svg class="chip-svg" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#F5B800"/></linearGradient></defs>
  <path d="M8 40C8 16 34 4 56 8c25 3 40 21 35 42-5 20-30 28-50 23C20 68 8 58 8 40Z" fill="url(#${id})" stroke="#E0A200" stroke-width="2"/>
  <path d="M26 30Q48 18 72 32" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>
  <circle cx="40" cy="48" r="3" fill="#E0A200" opacity=".5"/><circle cx="62" cy="52" r="2.5" fill="#E0A200" opacity=".5"/><circle cx="52" cy="40" r="2" fill="#E0A200" opacity=".5"/>
</svg>`;
}

/** Visual for a catalogue item (product bag, or stacked bags for a bundle). */
function itemThumb(item) {
  if (item.includes) {
    const first = PRODUCTS.find((p) => p.id === item.includes[0]);
    return bagSVG(first);
  }
  return bagSVG(item);
}

function bundleVisual(item) {
  const ids = item.includes.slice(0, 3);
  const bags = ids.map((id, i) => `<span class="bundle-bag b${i}">${bagSVG(PRODUCTS.find((p) => p.id === id))}</span>`).join("");
  return `<div class="bundle-visual" role="img" aria-label="${item.name} sample bundle illustration">${bags}</div>`;
}
