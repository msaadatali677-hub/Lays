/* ==========================================================================
   script.js — UI logic, rendering, GSAP animations, sliders
   Load order: products.js → cart.js → script.js
   ========================================================================== */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined";
const animate = hasGsap && !prefersReducedMotion;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = { category: "all", sort: "featured", query: "" };
let lastFocus = null;
let firstRender = true;

/* ============================ GLOBAL HELPERS ============================ */

function showToast(message, type = "success") {
  const icons = { success: "fa-circle-check", info: "fa-circle-info", error: "fa-circle-exclamation" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i><span></span>`;
  el.lastElementChild.textContent = message;
  const wrap = $("#toasts");
  wrap.appendChild(el);
  while (wrap.children.length > 3) wrap.removeChild(wrap.firstChild);
  if (animate) gsap.from(el, { y: 30, opacity: 0, duration: 0.35, ease: "power2.out" });
  setTimeout(() => {
    if (animate) gsap.to(el, { opacity: 0, y: 10, duration: 0.3, onComplete: () => el.remove() });
    else el.remove();
  }, 3000);
}

function bumpBadge(el) {
  if (animate) gsap.fromTo(el, { scale: 1.7 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
}

function lockScroll(lock) {
  document.body.classList.toggle("locked", lock);
}

/* ---------- Drawers / modals ---------- */

function openDrawer(drawer) {
  closeAll(true);
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  $("#overlay").hidden = false;
  requestAnimationFrame(() => $("#overlay").classList.add("show"));
  lockScroll(true);
  drawer.focus();
}

function openModal(modal) {
  closeAll(true);
  lastFocus = document.activeElement;
  modal.hidden = false;
  lockScroll(true);
  const dialog = $(".modal-dialog", modal);
  if (animate) gsap.fromTo(dialog, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
  const closeBtn = $(".modal-close", modal);
  if (closeBtn) closeBtn.focus();
}

function closeAll(silent) {
  $$(".drawer.open").forEach((d) => {
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
  });
  $$(".modal").forEach((m) => (m.hidden = true));
  const overlay = $("#overlay");
  overlay.classList.remove("show");
  overlay.hidden = true;
  lockScroll(false);
  if (!silent && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function openInfo(title, html) {
  $("#infoTitle").textContent = title;
  $("#infoBody").innerHTML = html;
  openModal($("#infoModal"));
}

/* ---------- Smooth scrolling ---------- */

function scrollToTarget(target) {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  const offset = ($("#siteHeader") ? $("#siteHeader").offsetHeight : 80) + 8;
  if (animate && window.ScrollToPlugin) {
    gsap.to(window, { duration: 0.9, scrollTo: { y: el, offsetY: offset }, ease: "power2.inOut" });
  } else {
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
}

/* ============================ RENDERING ============================ */

function productCard(p) {
  const on = Wishlist.has(p.id);
  return `<article class="product-card neu${firstRender ? " reveal" : ""}" data-id="${p.id}">
    ${p.badge ? `<span class="badge-tag${p.badge === "Sale" ? " sale" : ""}">${p.badge}</span>` : ""}
    <button type="button" class="icon-btn icon-btn-sm wish-btn${on ? " active" : ""}" data-action="wish" data-id="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remove" : "Add"} ${p.name} ${on ? "from" : "to"} wishlist"><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
    <div class="card-media" style="--c1:${p.colors.light};--c2:${p.colors.base}">${bagSVG(p)}</div>
    <div class="card-body">
      <h3>${p.name}</h3>
      <p class="card-desc">${p.desc}</p>
      <div class="rating" aria-label="Rated ${p.rating} out of 5 (sample)"><span class="stars">${starsHTML(p.rating)}</span><span class="rating-num">${p.rating.toFixed(1)}</span><span class="rating-count">(${p.reviews})</span></div>
      <div class="card-foot">
        <p class="price">${formatPrice(p.price)}${p.oldPrice ? `<s>${formatPrice(p.oldPrice)}</s>` : ""}<small>Sample price</small></p>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-action="add" data-id="${p.id}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to Cart</button>
        <button type="button" class="icon-btn icon-btn-sm" data-action="quick" data-id="${p.id}" aria-label="Quick view ${p.name}"><i class="fa-solid fa-eye" aria-hidden="true"></i></button>
      </div>
    </div>
  </article>`;
}

function getVisibleProducts() {
  const q = state.query.trim().toLowerCase();
  let list = PRODUCTS.filter((p) => {
    const inCat = state.category === "all" || p.category === state.category;
    const inQuery = !q || `${p.name} ${p.desc} ${p.category} ${p.notes.join(" ")}`.toLowerCase().includes(q);
    return inCat && inQuery;
  });
  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderChips() {
  const cats = [["all", "All"], ["classic", "Classic"], ["tangy", "Tangy"], ["savory", "Savory"], ["spicy", "Spicy"], ["creamy", "Creamy"]];
  $("#categoryChips").innerHTML = cats
    .map(([key, label]) => `<button type="button" class="chip${state.category === key ? " active" : ""}" data-chip="${key}" aria-pressed="${state.category === key}">${label}</button>`)
    .join("");
}

function renderProducts() {
  const list = getVisibleProducts();
  const grid = $("#productGrid");
  grid.innerHTML = list.map(productCard).join("");
  $("#noResults").hidden = list.length > 0;
  grid.hidden = list.length === 0;

  const bits = [];
  if (state.category !== "all") bits.push(`category “${state.category}”`);
  if (state.query.trim()) bits.push(`search “${state.query.trim()}”`);
  $("#resultsInfo").textContent = `Showing ${list.length} of ${PRODUCTS.length} products${bits.length ? " · " + bits.join(", ") : ""}`;

  if (!firstRender && animate && list.length) {
    gsap.from("#productGrid .product-card", { y: 28, opacity: 0, duration: 0.5, stagger: 0.07, ease: "power3.out", clearProps: "transform,opacity" });
  }
  firstRender = false;
}

function renderFlavors() {
  $("#flavorWrapper").innerHTML = PRODUCTS.map(
    (p) => `<div class="swiper-slide">
      <article class="flavor-card neu" style="--c1:${p.colors.light};--c2:${p.colors.base};--c3:${p.colors.deep}">
        <div class="flavor-media">${bagSVG(p)}</div>
        <div class="flavor-info">
          <ul class="note-list">${p.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
          <h3>${p.name.replace("Lay's ", "")}</h3>
          <p>${p.desc}</p>
          <button type="button" class="btn btn-light btn-sm" data-action="quick" data-id="${p.id}">Explore <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
        </div>
      </article>
    </div>`
  ).join("");
}

const REVIEWS = [
  { name: "Abdullah", rating: 5, text: "The crunch is unreal! Masala is my go-to for every movie night.", tag: "Sample review" },
  { name: "Eshban", rating: 4.5, text: "Barbecue is smoky and just right. Perfect for sharing with friends.", tag: "Sample review" },
  { name: "Sana", rating: 5, text: "Sour Cream & Onion is so smooth and tasty. Disappears in minutes!", tag: "Sample review" },
  { name: "Bilal", rating: 4, text: "Salt & Vinegar has a great tang. A tiny bit sharp, which I love.", tag: "Sample review" },
  { name: "Mehwish", rating: 5, text: "Brought the Party Share Box to a get-together and everyone was happy.", tag: "Sample review" }
];

function renderReviews() {
  $("#reviewWrapper").innerHTML = REVIEWS.map((r) => {
    const initials = r.name.split(" ").map((s) => s[0]).join("").replace(".", "");
    return `<div class="swiper-slide"><article class="review-card neu">
      <div class="review-top"><span class="avatar" aria-hidden="true">${initials}</span><div><h3>${r.name}</h3><span class="sample-tag">${r.tag}</span></div></div>
      <div class="stars" aria-label="${r.rating} out of 5 stars">${starsHTML(r.rating)}</div>
      <p>“${r.text}”</p>
    </article></div>`;
  }).join("");
}

function renderOffers() {
  const sale = PRODUCTS.filter((p) => p.oldPrice);
  $("#saleGrid").innerHTML = sale
    .map(
      (p) => `<article class="sale-card neu reveal" style="--c1:${p.colors.light};--c2:${p.colors.base}">
        <div class="sale-media">${bagSVG(p)}</div>
        <div class="sale-info">
          <span class="badge-tag sale static">Sample deal</span>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <p class="price">${formatPrice(p.price)}<s>${formatPrice(p.oldPrice)}</s></p>
          <button type="button" class="btn btn-primary btn-sm" data-action="add" data-id="${p.id}">Shop Now <i class="fa-solid fa-cart-plus" aria-hidden="true"></i></button>
        </div>
      </article>`
    )
    .join("");

  $("#bundleGrid").innerHTML = BUNDLES.map(
    (b) => `<article class="bundle-card neu reveal">
      <span class="badge-tag static">${b.tag}</span>
      ${bundleVisual(b)}
      <h3>${b.name}</h3>
      <p>${b.desc}</p>
      <p class="price">${formatPrice(b.price)}<s>${formatPrice(b.oldPrice)}</s></p>
      <button type="button" class="btn btn-primary btn-sm" data-action="add" data-id="${b.id}">Shop Now <i class="fa-solid fa-cart-plus" aria-hidden="true"></i></button>
    </article>`
  ).join("");
}

function renderHeroArt() {
  $("#heroBagMain").innerHTML = bagSVG(PRODUCTS[0]);
  $("#heroBagL").innerHTML = bagSVG(PRODUCTS[2]);
  $("#heroBagR").innerHTML = bagSVG(PRODUCTS[3]);
  $$(".float-chip").forEach((c) => (c.innerHTML = chipSVG()));
  $("#aboutBags").innerHTML = `<span class="ab ab1">${bagSVG(PRODUCTS[4])}</span><span class="ab ab2">${bagSVG(PRODUCTS[0])}</span><span class="ab ab3">${bagSVG(PRODUCTS[1])}</span>`;
}

/* ============================ QUICK VIEW ============================ */

function openQuickView(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const on = Wishlist.has(p.id);
  $("#qvBody").innerHTML = `
    <div class="qv-media" style="--c1:${p.colors.light};--c2:${p.colors.base}">${bagSVG(p)}</div>
    <div class="qv-info">
      <p class="eyebrow eyebrow-red">${p.category}</p>
      <h2 id="qvTitle">${p.name}</h2>
      <div class="rating"><span class="stars">${starsHTML(p.rating)}</span><span class="rating-num">${p.rating.toFixed(1)}</span><span class="rating-count">(${p.reviews} sample reviews)</span></div>
      <p class="qv-text">${p.long}</p>
      <ul class="note-list">${p.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
      <p class="price big">${formatPrice(p.price)}${p.oldPrice ? `<s>${formatPrice(p.oldPrice)}</s>` : ""}<small>Sample price</small></p>
      <div class="qv-actions">
        <div class="qty" role="group" aria-label="Quantity">
          <button type="button" data-qv="dec" aria-label="Decrease quantity"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
          <span id="qvQty" aria-live="polite">1</span>
          <button type="button" data-qv="inc" aria-label="Increase quantity"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
        </div>
        <button type="button" class="btn btn-primary" data-qv="add" data-id="${p.id}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to Cart</button>
        <button type="button" class="icon-btn wish-btn${on ? " active" : ""}" data-action="wish" data-id="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remove" : "Add"} ${p.name} ${on ? "from" : "to"} wishlist"><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
      </div>
    </div>`;
  openModal($("#quickView"));
}

/* ============================ FILTER ACTIONS ============================ */

function applyFilters({ category, query, scroll } = {}) {
  if (category !== undefined) state.category = category;
  if (query !== undefined) {
    state.query = query;
    $("#productSearch").value = query;
    $("#searchInput").value = query;
  }
  renderChips();
  renderProducts();
  if (scroll) scrollToTarget("#products");
}

/* ============================ NEWSLETTER ============================ */

function initNewsletter() {
  const form = $("#newsletterForm");
  const input = $("#emailInput");
  const msg = $("#newsletterMsg");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const setMsg = (text, ok) => {
    msg.textContent = text;
    msg.className = "form-msg " + (ok ? "ok" : "err");
    input.setAttribute("aria-invalid", ok ? "false" : "true");
  };

  input.addEventListener("input", () => {
    msg.textContent = "";
    input.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return setMsg("Please enter your email address.", false);
    if (!emailRe.test(value)) return setMsg("That doesn't look like a valid email. Try name@example.com.", false);
    setMsg("Thanks for subscribing! (Demo — nothing was sent.)", true);
    showToast("Subscribed! Welcome to the loop 🎉", "success");
    form.reset();
    input.removeAttribute("aria-invalid");
  });
}

/* ============================ NAV ============================ */

function initNav() {
  const header = $("#siteHeader");
  const links = $$(".nav-link");
  const burger = $("#hamburger");
  const menu = $("#navLinks");

  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));

  window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

  // Active link indicator
  const sections = links.map((l) => document.getElementById(l.dataset.section)).filter(Boolean);
  const setActive = (id) => links.forEach((l) => l.classList.toggle("active", l.dataset.section === id));
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = "home";
    sections.forEach((s) => {
      if (s.offsetTop <= y) current = s.id;
    });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) current = "contact";
    setActive(current);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Smooth anchor scrolling
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    scrollToTarget(target);
  });

  // Search panel
  const panel = $("#searchPanel");
  const toggle = $("#searchToggle");
  const input = $("#searchInput");
  const setSearch = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      if (animate) gsap.from(panel, { y: -12, opacity: 0, duration: 0.3 });
      input.focus();
    }
  };
  toggle.addEventListener("click", () => setSearch(panel.hidden));
  $("#searchClose").addEventListener("click", () => {
    setSearch(false);
    toggle.focus();
  });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    scrollToTarget("#products");
  });
  input.addEventListener("input", () => applyFilters({ query: input.value }));
}

/* ============================ SLIDERS ============================ */

function initSliders() {
  if (typeof Swiper === "undefined") {
    $$(".swiper").forEach((s) => s.classList.add("no-swiper"));
    return;
  }
  new Swiper("#flavorSwiper", {
    slidesPerView: 1.15,
    spaceBetween: 22,
    grabCursor: true,
    keyboard: { enabled: true },
    pagination: { el: "#flavorSwiper .swiper-pagination", clickable: true },
    navigation: { nextEl: ".flavor-next", prevEl: ".flavor-prev" },
    breakpoints: { 640: { slidesPerView: 2 }, 1000: { slidesPerView: 3 } }
  });
  new Swiper("#reviewSwiper", {
    slidesPerView: 1,
    spaceBetween: 22,
    grabCursor: true,
    autoplay: prefersReducedMotion ? false : { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true },
    pagination: { el: "#reviewSwiper .swiper-pagination", clickable: true },
    breakpoints: { 700: { slidesPerView: 2 }, 1050: { slidesPerView: 3 } }
  });
}

/* ============================ GSAP ANIMATIONS ============================ */

function initAnimations() {
  if (!animate) {
    document.documentElement.classList.add("no-anim");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  document.documentElement.classList.add("js-anim");

  // Navbar + hero entrance
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".navbar", { y: -60, opacity: 0, duration: 0.7 })
    .from(".hero-card", { opacity: 0, scale: 0.97, duration: 0.7 }, "-=0.4")
    .from(".hero-anim", { y: 30, opacity: 0, duration: 0.7, stagger: 0.11 }, "-=0.4")
    .from(".hero-bag-main", { y: 80, opacity: 0, scale: 0.9, duration: 0.9 }, "-=0.8")
    .from(".hero-bag-side.left", { x: 60, opacity: 0, rotation: -4, duration: 0.8 }, "-=0.6")
    .from(".hero-bag-side.right", { x: -60, opacity: 0, rotation: 4, duration: 0.8 }, "<")
    .from(".hero .float-chip", { scale: 0, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(2)" }, "-=0.5")
    .from(".deco", { scale: 0.6, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.3);

  // Floating effects
  gsap.to(".hero-bag-main", { y: -14, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".hero-bag-side.left", { y: -10, duration: 3.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.4 });
  gsap.to(".hero-bag-side.right", { y: -12, duration: 3.3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.8 });
  $$(".float-chip").forEach((chip, i) => {
    gsap.to(chip, {
      y: gsap.utils.random(-22, 22),
      x: gsap.utils.random(-14, 14),
      rotation: gsap.utils.random(-28, 28),
      duration: gsap.utils.random(2.4, 4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.15
    });
  });

  // Scroll reveals (section transitions + cards)
  ScrollTrigger.batch(".reveal", {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(batch, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", overwrite: true, clearProps: "transform" })
  });

  // Gentle hero parallax
  gsap.to(".hero-visual", {
    yPercent: -6,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  // Button hover effects
  document.addEventListener("pointerover", (e) => {
    const b = e.target.closest(".btn");
    if (b && !b.contains(e.relatedTarget)) gsap.to(b, { scale: 1.04, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  });
  document.addEventListener("pointerout", (e) => {
    const b = e.target.closest(".btn");
    if (b && !b.contains(e.relatedTarget)) gsap.to(b, { scale: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  });

  // Product card hover lift on the artwork
  document.addEventListener("pointerover", (e) => {
    const card = e.target.closest(".product-card, .flavor-card, .bundle-card");
    if (!card || card.contains(e.relatedTarget)) return;
    const art = card.querySelector(".bag-svg, .bundle-visual");
    if (art) gsap.to(art, { y: -6, rotation: -2, duration: 0.35, ease: "power2.out", overwrite: "auto" });
  });
  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".product-card, .flavor-card, .bundle-card");
    if (!card || card.contains(e.relatedTarget)) return;
    const art = card.querySelector(".bag-svg, .bundle-visual");
    if (art) gsap.to(art, { y: 0, rotation: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ============================ EVENT WIRING ============================ */

function initEvents() {
  // Global delegated click handling
  document.addEventListener("click", (e) => {
    const t = e.target;

    const actionBtn = t.closest("[data-action]");
    if (actionBtn) {
      const id = Number(actionBtn.dataset.id);
      const item = findItem(id);
      switch (actionBtn.dataset.action) {
        case "add":
          Cart.add(id);
          showToast(`${item.name} added to cart`, "success");
          if (animate) gsap.fromTo(actionBtn, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
          break;
        case "wish": {
          const on = Wishlist.toggle(id);
          showToast(on ? `${item.name} saved to wishlist` : "Removed from wishlist", on ? "success" : "info");
          break;
        }
        case "quick":
          openQuickView(id);
          break;
      }
      return;
    }

    // Quick view internals
    const qv = t.closest("[data-qv]");
    if (qv) {
      const qtyEl = $("#qvQty");
      let qty = Number(qtyEl.textContent);
      if (qv.dataset.qv === "inc") qty = Math.min(99, qty + 1);
      if (qv.dataset.qv === "dec") qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
      if (qv.dataset.qv === "add") {
        const id = Number(qv.dataset.id);
        Cart.add(id, qty);
        showToast(`${qty} × ${findItem(id).name} added to cart`, "success");
        closeAll(true);
        openDrawer($("#cartDrawer"));
      }
      return;
    }

    // Category chips / footer categories
    const chip = t.closest("[data-chip]");
    if (chip) return applyFilters({ category: chip.dataset.chip });
    const footCat = t.closest("[data-cat]");
    if (footCat) return applyFilters({ category: footCat.dataset.cat, query: "", scroll: true });

    // Offer banners
    const offer = t.closest("[data-offer]");
    if (offer) {
      if (offer.dataset.offer === "bundles") scrollToTarget("#bundlesHeading");
      else if (offer.dataset.offer === "cat-spicy") applyFilters({ category: "spicy", query: "", scroll: true });
      return;
    }

    // Close buttons (drawers / modals) and optional goto
    const closeBtn = t.closest("[data-close]");
    if (closeBtn) {
      closeAll();
      if (closeBtn.dataset.goto) scrollToTarget("#" + closeBtn.dataset.goto);
      return;
    }

    if (t.closest("[data-clear-cart]")) {
      Cart.clear();
      closeAll();
      showToast("Demo complete — cart cleared", "info");
      return;
    }

    // Footer / demo links
    if (t.closest("[data-demo-link]")) return showToast("Demo link — social pages aren't connected.", "info");
    const info = t.closest("[data-info]");
    if (info) {
      if (info.dataset.info === "privacy")
        openInfo("Privacy Policy (sample)", "<p>This is a frontend demo. It uses your browser's LocalStorage only to remember your cart and wishlist on this device. No data is sent to any server, and no accounts or payments exist.</p>");
      else
        openInfo("Terms &amp; Conditions (sample)", "<p>This website is an independent concept demo. All products, prices, offers and reviews are fictional sample content. Brand names belong to their respective owners. Nothing here can be purchased.</p>");
      return;
    }

    if (t.closest("#learnMore")) {
      openInfo(
        "About this demo",
        "<p>Lay's is a snack brand enjoyed in many countries. This page is an unofficial, frontend-only concept that showcases a Neumorphism-style snack shop with a working cart, wishlist, search, filters and quick view.</p><p>Everything is sample content, so use it freely as inspiration for your own project.</p>"
      );
      return;
    }

    if (t.closest("#resetFilters")) {
      state.sort = "featured";
      $("#sortSelect").value = "featured";
      return applyFilters({ category: "all", query: "" });
    }

    if (t.closest("#cartToggle")) return openDrawer($("#cartDrawer"));
    if (t.closest("#wishToggle")) return openDrawer($("#wishDrawer"));
    if (t === $("#overlay")) return closeAll();
    if (t === $("#quickView") || t === $("#infoModal")) return closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
      const panel = $("#searchPanel");
      if (!panel.hidden) {
        panel.hidden = true;
        $("#searchToggle").setAttribute("aria-expanded", "false");
      }
      $("#navLinks").classList.remove("open");
      $("#hamburger").classList.remove("open");
      $("#hamburger").setAttribute("aria-expanded", "false");
    }
  });

  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderProducts();
  });
  $("#productSearch").addEventListener("input", (e) => applyFilters({ query: e.target.value }));
}

/* ============================ INIT ============================ */

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();

  renderHeroArt();
  renderChips();
  renderProducts();
  renderFlavors();
  renderOffers();
  renderReviews();

  Cart.init();
  Wishlist.init();

  initNav();
  initEvents();
  initNewsletter();
  initSliders();
  initAnimations();
});
