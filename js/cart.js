/* ==========================================================================
   cart.js — cart + wishlist logic (LocalStorage only, no backend)
   Depends on: products.js (findItem, formatPrice, itemThumb, PRODUCTS)
   Uses globals from script.js at event time: showToast, openInfo, bumpBadge
   ========================================================================== */

const CART_KEY = "lays_demo_cart_v1";
const WISH_KEY = "lays_demo_wishlist_v1";
const FREE_DELIVERY_AT = 1000;
const DELIVERY_FEE = 100;

const Store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode etc.) — app keeps working in memory */
    }
  }
};

/* ------------------------------ CART ------------------------------ */

const Cart = {
  items: [],
  prevCount: 0,

  init() {
    const saved = Store.read(CART_KEY, []);
    this.items = Array.isArray(saved)
      ? saved
          .filter((i) => i && findItem(i.id) && i.qty > 0)
          .map((i) => ({ id: i.id, qty: Math.min(99, Math.floor(i.qty)) }))
      : [];
    this.prevCount = this.count();
    this.render();

    const list = document.getElementById("cartList");
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cart]");
      if (!btn) return;
      const id = Number(btn.closest("li").dataset.id);
      const it = this.items.find((i) => i.id === id);
      if (!it) return;
      const action = btn.dataset.cart;
      if (action === "inc") this.setQty(id, it.qty + 1);
      else if (action === "dec") this.setQty(id, it.qty - 1);
      else if (action === "remove") {
        this.remove(id);
        showToast("Removed from cart", "info");
      }
    });

    document.getElementById("checkoutBtn").addEventListener("click", () => this.checkout());
    document.getElementById("clearCartBtn").addEventListener("click", () => {
      if (!this.items.length) return;
      this.clear();
      showToast("Cart cleared", "info");
    });
  },

  save() {
    Store.write(CART_KEY, this.items);
  },

  add(id, qty = 1) {
    const it = this.items.find((i) => i.id === id);
    if (it) it.qty = Math.min(99, it.qty + qty);
    else this.items.push({ id, qty: Math.min(99, qty) });
    this.changed();
  },

  remove(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.changed();
  },

  setQty(id, qty) {
    if (qty <= 0) return this.remove(id);
    const it = this.items.find((i) => i.id === id);
    if (it) it.qty = Math.min(99, qty);
    this.changed();
  },

  clear() {
    this.items = [];
    this.changed();
  },

  count() {
    return this.items.reduce((n, i) => n + i.qty, 0);
  },

  subtotal() {
    return this.items.reduce((sum, i) => sum + findItem(i.id).price * i.qty, 0);
  },

  delivery() {
    if (!this.items.length) return 0;
    return this.subtotal() >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  },

  total() {
    return this.subtotal() + this.delivery();
  },

  changed() {
    this.save();
    this.render();
  },

  checkout() {
    if (!this.items.length) {
      showToast("Your cart is empty — add a snack first!", "error");
      return;
    }
    const rows = this.items
      .map((i) => {
        const it = findItem(i.id);
        return `<li><span>${it.name} × ${i.qty}</span><strong>${formatPrice(it.price * i.qty)}</strong></li>`;
      })
      .join("");
    openInfo(
      "Demo Checkout",
      `<p><strong>This is a frontend demo.</strong> No order is placed and no payment is processed or stored.</p>
       <ul class="demo-summary">${rows}
         <li><span>Delivery</span><strong>${this.delivery() === 0 ? "Free" : formatPrice(this.delivery())}</strong></li>
         <li class="grand"><span>Total</span><strong>${formatPrice(this.total())}</strong></li>
       </ul>
       <button type="button" class="btn btn-primary" data-clear-cart>Clear cart &amp; close</button>`
    );
  },

  render() {
    const count = this.count();
    const badge = document.getElementById("cartCount");
    badge.textContent = count;
    badge.hidden = count === 0;
    if (count > this.prevCount) bumpBadge(badge);
    this.prevCount = count;

    const list = document.getElementById("cartList");
    const empty = document.getElementById("cartEmpty");
    const footer = document.getElementById("cartFooter");

    if (!this.items.length) {
      list.innerHTML = "";
      empty.hidden = false;
      footer.hidden = true;
      return;
    }
    empty.hidden = true;
    footer.hidden = false;

    list.innerHTML = this.items
      .map((i) => {
        const it = findItem(i.id);
        return `<li class="cart-item" data-id="${it.id}">
          <div class="cart-thumb">${itemThumb(it)}</div>
          <div class="cart-info">
            <h3>${it.name}</h3>
            <p class="cart-unit">${formatPrice(it.price)}</p>
            <div class="qty" role="group" aria-label="Quantity for ${it.name}">
              <button type="button" data-cart="dec" aria-label="Decrease quantity of ${it.name}"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
              <span aria-live="polite">${i.qty}</span>
              <button type="button" data-cart="inc" aria-label="Increase quantity of ${it.name}"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
            </div>
          </div>
          <div class="cart-line">
            <strong>${formatPrice(it.price * i.qty)}</strong>
            <button type="button" class="remove-btn" data-cart="remove" aria-label="Remove ${it.name} from cart"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
          </div>
        </li>`;
      })
      .join("");

    document.getElementById("cartSubtotal").textContent = formatPrice(this.subtotal());
    document.getElementById("cartDelivery").textContent = this.delivery() === 0 ? "Free" : formatPrice(this.delivery());
    document.getElementById("cartTotal").textContent = formatPrice(this.total());

    const remaining = FREE_DELIVERY_AT - this.subtotal();
    const hint = document.getElementById("freeShipHint");
    const bar = document.getElementById("freeShipBar");
    if (remaining > 0) {
      hint.textContent = `Add ${formatPrice(remaining)} more for free delivery (sample offer)`;
    } else {
      hint.textContent = "You've unlocked free delivery (sample offer)!";
    }
    bar.style.width = Math.min(100, (this.subtotal() / FREE_DELIVERY_AT) * 100) + "%";
  }
};

/* ---------------------------- WISHLIST ---------------------------- */

const Wishlist = {
  ids: [],
  prevCount: 0,

  init() {
    const saved = Store.read(WISH_KEY, []);
    this.ids = Array.isArray(saved) ? saved.filter((id) => PRODUCTS.some((p) => p.id === id)) : [];
    this.prevCount = this.ids.length;
    this.render();

    document.getElementById("wishList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wl]");
      if (!btn) return;
      const id = Number(btn.closest("li").dataset.id);
      if (btn.dataset.wl === "remove") {
        this.toggle(id);
        showToast("Removed from wishlist", "info");
      } else if (btn.dataset.wl === "cart") {
        Cart.add(id);
        showToast(`${findItem(id).name} added to cart`, "success");
      }
    });
  },

  has(id) {
    return this.ids.includes(id);
  },

  toggle(id) {
    const on = !this.has(id);
    this.ids = on ? this.ids.concat(id) : this.ids.filter((x) => x !== id);
    Store.write(WISH_KEY, this.ids);
    this.render();
    return on;
  },

  render() {
    const badge = document.getElementById("wishCount");
    badge.textContent = this.ids.length;
    badge.hidden = this.ids.length === 0;
    if (this.ids.length > this.prevCount) bumpBadge(badge);
    this.prevCount = this.ids.length;

    document.querySelectorAll('[data-action="wish"]').forEach((b) => {
      const id = Number(b.dataset.id);
      const on = this.has(id);
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
      const name = findItem(id) ? findItem(id).name : "item";
      b.setAttribute("aria-label", on ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`);
    });

    const list = document.getElementById("wishList");
    const empty = document.getElementById("wishEmpty");
    if (!this.ids.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.innerHTML = this.ids
      .map((id) => {
        const p = findItem(id);
        return `<li class="cart-item" data-id="${p.id}">
          <div class="cart-thumb">${itemThumb(p)}</div>
          <div class="cart-info">
            <h3>${p.name}</h3>
            <p class="cart-unit">${formatPrice(p.price)}</p>
            <button type="button" class="btn btn-sm btn-primary" data-wl="cart"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to cart</button>
          </div>
          <div class="cart-line">
            <button type="button" class="remove-btn" data-wl="remove" aria-label="Remove ${p.name} from wishlist"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
          </div>
        </li>`;
      })
      .join("");
  }
};
