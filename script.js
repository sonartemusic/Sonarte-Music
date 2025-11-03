/* ========= SPA + Catálogo + Carrito (sin librerías) =========
   - Navegación hash-based para secciones (home, productos, accesorios, checkout, etc.)
   - Catálogo definido como array de objetos
   - Búsqueda en tiempo real + filtros + orden
   - Carrito persistente en localStorage con cantidades
   - Checkout simulado con validaciones
   - Accesibilidad mínima: focus, aria-expanded, roles
*/

// ---------- Datos del catálogo (puedes editar/añadir) ----------
const PRODUCTS = [
  { id: 'gtr-ac-01', name: 'Guitarra Acústica Fender', category: 'Instrumento', price: 150000, badge: 'Oferta', img: 'img/ACO.jpg' },
  { id: 'kbd-ym-01', name: 'Teclado Yamaha', category: 'MIDI', price: 350000, img: 'img/yam.jpg' },
  { id: 'in-ear-01', name: 'In-Ear KZ EDX Pro', category: 'Accesorio', price: 80000, img: 'EDX.jpg', badge: 'Nuevo' },
  { id: 'midi-kb-01', name: 'Controlador MIDI 49 teclas', category: 'MIDI', price: 420000, img: 'midi.jpg' },
  { id: 'seq-01', name: 'Paquete secuencias EDM', category: 'Secuencia', price: 45000, img: 'sec.png' },
  { id: 'amp-01', name: 'Amplificador 30W Fender', category: 'Accesorio', price: 220000, img: 'img/30w.jpg' },

  // 🎧 Monitores de estudio
  {
    id: 201,
    name: "Monitores Behringer Studio 50USB",
    category: "Accesorio",
    price: 850000,
    img: "img/50usb.jpg",
    desc: "Par de monitores activos de 5\" con entradas USB y RCA. Sonido preciso y balanceado para mezcla y producción.",
  },
  {
    id: 202,
    name: "Monitores Yamaha HS5",
    category: "Accesorio",
    price: 1300000,
    img: "img/hs5.jpg",
    desc: "Monitores de referencia profesionales de 5 pulgadas con sonido claro y respuesta plana.",
  },

  // 🎧 Cascos / Audífonos
  {
    id: 203,
    name: "Audífonos de Estudio Audio-Technica ATH-M40x",
    category: "Accesorio",
    price: 690000,
    img: "img/m40x.jpg",
    desc: "Audífonos cerrados de monitoreo profesional, gran comodidad y respuesta precisa.",
  },
  {
    id: 204,
    name: "Audífonos In-Ear Shure SE215",
    category: "Accesorio",
    price: 880000,
    img: "img/Shure.jpg",
    desc: "In-ear profesionales con aislamiento de ruido y sonido detallado. Cable desmontable reforzado.",
  },

  // 🎚️ Interfaces de audio
  {
    id: 205,
    name: "Behringer UMC22 U-Phoria",
    category: "MIDI",
    price: 480000,
    img: "img/umc.jpg",
    desc: "Interface de audio USB con preamplificador MIDAS. Ideal para home studio.",
  },
  {
    id: 206,
    name: "Focusrite Scarlett 2i2 (3rd Gen)",
    category: "MIDI",
    price: 1150000,
    img: "img/212.jpg",
    desc: "Interface de audio USB con dos entradas combo y excelente calidad de grabación.",
  },

  // 🎤 Micrófonos
  {
    id: 207,
    name: "Shure SM58",
    category: "Instrumento",
    price: 750000,
    img: "img/sm.jpg",
    desc: "Micrófono dinámico vocal, estándar de la industria por su durabilidad y sonido natural.",
  },
  {
    id: 208,
    name: "Behringer B-1 Condenser",
    category: "Instrumento",
    price: 680000,
    img: "img/b1.jpg",
    desc: "Micrófono de condensador cardioide ideal para voces e instrumentos acústicos.",
  },
  {
    id: 209,
    name: "AKG P120 Condenser",
    category: "Instrumento",
    price: 590000,
    img: "img/akg.jpg",
    desc: "Micrófono condensador versátil con cápsula de 2/3” y respuesta suave.",
  },
];


// ---------- Estado ----------
const state = {
  route: '/',
  products: PRODUCTS.slice(),
  query: '',
  category: 'all',
  sort: 'relevance',
  cart: JSON.parse(localStorage.getItem('sonarte_cart') || '[]'), // [{id, qty}]
};

const IVA = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--iva')) || 0.19;

// ---------- HELPERS ----------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const formatCurrency = n => {
  // Format as $XXX.XXX (Colombian-like)
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

// ---------- ROUTING (hash-based) ----------
function navigateTo(route) {
  window.location.hash = route;
}
function handleRoute() {
  const hash = location.hash.replace(/^#/, '') || '/';
  state.route = hash;
  const pages = $$('.page');
  pages.forEach(p => p.classList.remove('page--active'));
  // map route to section id: '/productos' -> 'productos'
  const key = hash.split('?')[0].replace(/^\//, '') || 'home';
  const pageEl = document.getElementById(key);
  if (pageEl) pageEl.classList.add('page--active');
  // if route is productos, ensure products render
  if (key === 'productos') renderProducts();
  if (key === 'accesorios') renderAccessories();
    // asegurar que checkout solo sea visible si estamos en /checkout
  const checkoutSection = document.getElementById('checkout');

  // scroll to top of main
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  hydrateUI();
  handleRoute();

  // Asegurar que el contenedor exista antes de renderizar
  const checkReady = () => {
    const featuredGrid = document.getElementById('featuredGrid');
    if (featuredGrid) {
      renderFeatured();
      renderProducts();
      updateCartUI();
    } else {
      // esperar 100ms y volver a intentar hasta que exista
      setTimeout(checkReady, 100);
    }
  };
  checkReady();
});


// ---------- UI HYDRATION ----------
function hydrateUI() {
  // header elements
  const searchInput = $('#globalSearch');
  const clearSearch = $('#clearSearch');
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const cartToggle = $('#cartToggle');
  const cartPanel = $('#cartPanel');
  const closeCartPanel = $('#closeCartPanel');

  // menu toggle (mobile)
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
  });

  // search
  searchInput.addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    // if in productos show filtered results live
    if (location.hash.includes('/productos') || !location.hash) {
      renderProducts();
    }
  });
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    renderProducts();
    searchInput.focus();
  });

  // cart toggle
  cartToggle.addEventListener('click', () => {
    const expanded = cartToggle.getAttribute('aria-expanded') === 'true';
    cartToggle.setAttribute('aria-expanded', String(!expanded));
    toggleCartPanel();
  });
  closeCartPanel.addEventListener('click', () => {
    cartToggle.setAttribute('aria-expanded', 'false');
    toggleCartPanel(false);
  });

  // keyboard: ESC closes cart panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleCartPanel(false);
      $('#menuToggle').setAttribute('aria-expanded', 'false');
      $('#mainNav').classList.remove('open');
    }
  });

  // filters
  $('#categoryFilter').addEventListener('change', (e) => {
    state.category = e.target.value;
    renderProducts();
  });
  $('#sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderProducts();
  });

  // contact form
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#contactFeedback').textContent = 'Mensaje enviado. Gracias por contactar a Sonarte.';
    e.target.reset();
  });

  // subscribe form
  $('#subscribeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Gracias por suscribirte!');
    e.target.reset();
  });

  // go to checkout from cart panel
  $('#goCheckoutBtn').addEventListener('click', () => {
    toggleCartPanel(false);
    openCheckoutModal();

  });

  // empty cart
  $('#emptyCartBtn').addEventListener('click', () => {
    if (!confirm('¿Vaciar el carrito?')) return;
    state.cart = [];
    persistCart();
    updateCartUI();
  });

  // checkout form actions
  $('#cancelCheckoutBtn').addEventListener('click', () => {
    navigateTo('/');
  });
  

  // contact keyboard accessibility: enter in search triggers products page
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateTo('/productos');
  });
}

function toggleCartPanel(force) {
  const panel = $('#cartPanel');
  const btn = $('#cartToggle');
  const isOpen = panel.classList.contains('open');
  const shouldOpen = typeof force === 'boolean' ? force : !isOpen;

  if (shouldOpen) {
    panel.classList.add('open');
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-modal', 'true');
    btn.setAttribute('aria-expanded', 'true');
    $('#closeCartPanel').focus();
  } else {
    panel.classList.remove('open');
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-modal', 'false');
    btn.setAttribute('aria-expanded', 'false');
  }
}


// ---------- CART LOGIC ----------
function findCartItem(id) { return state.cart.find(i => i.id === id); }
function addToCart(id, qty = 1) {
  const item = findCartItem(id);
  if (item) item.qty += qty;
  else state.cart.push({ id, qty });
  persistCart();
  updateCartUI();
}
function setCartQty(id, qty) {
  qty = Math.max(0, parseInt(qty) || 0);
  const item = findCartItem(id);
  if (!item) return;
  if (qty === 0) state.cart = state.cart.filter(i => i.id !== id);
  else item.qty = qty;
  persistCart();
  updateCartUI();
}
function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  persistCart();
  updateCartUI();
}
function persistCart() {
  localStorage.setItem('sonarte_cart', JSON.stringify(state.cart));
}
function cartCountTotal() {
  return state.cart.reduce((s, it) => s + it.qty, 0);
}
function cartSubtotal() {
  return state.cart.reduce((sum, it) => {
    const p = PRODUCTS.find(prod => prod.id === it.id);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);
}
function cartTotals() {
  const subtotal = cartSubtotal();
  const iva = Math.round(subtotal * IVA);
  const total = subtotal + iva;
  return { subtotal, iva, total };
}

// ---------- UPDATE CART UI ----------
function updateCartUI() {
  // count in header
  $('#cartCount').textContent = cartCountTotal();
  // panel items
  const container = $('#cartPanelItems');
  container.innerHTML = '';
  if (state.cart.length === 0) {
    container.innerHTML = '<p class="center">Tu carrito está vacío</p>';
  } else {
    state.cart.forEach(ci => {
      const prod = PRODUCTS.find(p => p.id === ci.id);
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="meta">
          <strong>${prod.name}</strong>
          <div class="price small">${formatCurrency(prod.price)} x ${ci.qty}</div>
        </div>
        <div class="qty">
          <button class="icon-btn dec" data-id="${ci.id}" aria-label="Disminuir">−</button>
          <input class="qty-input" data-id="${ci.id}" value="${ci.qty}" />
          <button class="icon-btn inc" data-id="${ci.id}" aria-label="Aumentar">+</button>
          <button class="icon-btn remove" data-id="${ci.id}" aria-label="Eliminar">✖</button>
        </div>
      `;
      container.appendChild(div);
    });
  }
  // totals
  const t = cartTotals();
  $('#cartPanelTotals').innerHTML = `
    <div>Subtotal: ${formatCurrency(t.subtotal)}</div>
    <div>IVA: ${formatCurrency(t.iva)}</div>
    <div><strong>Total: ${formatCurrency(t.total)}</strong></div>
  `;
  // attach listeners (delegation style)
  $$('.dec', container).forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.id; const it = findCartItem(id);
    if (!it) return;
    setCartQty(id, Math.max(0, it.qty - 1));
  }));
  $$('.inc', container).forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.id; const it = findCartItem(id);
    if (!it) return;
    setCartQty(id, it.qty + 1);
  }));
  $$('.remove', container).forEach(b => b.addEventListener('click', () => {
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    removeFromCart(b.dataset.id);
  }));
  $$('.qty-input', container).forEach(inp => {
    inp.addEventListener('change', (e) => {
      setCartQty(inp.dataset.id, parseInt(e.target.value) || 0);
    });
  });
}

// ---------- RENDER: Featured + Products + Accessories ----------
function renderFeatured() {
  const featured = $('#featuredGrid');
  featured.innerHTML = '';
  // first 3 products
  PRODUCTS.slice(0, 3).forEach(p => featured.appendChild(createProductCard(p, true)));
}

function createProductCard(product, compact = false) {
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role', 'article');
  card.innerHTML = `
    ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
    <img src="${product.img}" alt="${product.name}" loading="lazy" onerror="this.style.opacity=.6;this.alt+=' (imagen no disponible)';" />
    <h3>${product.name}</h3>
    <div class="price">${formatCurrency(product.price)}</div>
    <div style="margin-top:10px;display:flex;gap:8px">
      <button class="btn-primary add-btn" data-id="${product.id}" aria-label="Añadir ${product.name}">Añadir</button>
      <button class="btn-secondary details-btn" data-id="${product.id}">Ver</button>
    </div>
  `;
  if (compact) card.style.width = '260px';
  // attach add listener
  card.querySelector('.add-btn').addEventListener('click', () => {
    addToCart(product.id, 1);
    // micro-feedback
    const prev = card.style.transform;
    card.style.transform = 'scale(0.98)';
    setTimeout(() => card.style.transform = prev, 160);
  });
  // details -> open product modal or route to product page (not implemented full)
  card.querySelector('.details-btn').addEventListener('click', () => showModal(product));

  return card;
}
// ----- MODAL PRODUCTO -----
const modal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

if (closeModal) closeModal.addEventListener('click', () => modal.hidden = true);
window.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

function showModal(product) {
  modalBody.innerHTML = `
    <h3>${product.name}</h3>
    <img src="${product.img}" alt="${product.name}" style="width:100%;border-radius:8px;margin-bottom:12px;">
    <p><strong>Categoría:</strong> ${product.category}</p>
    ${product.desc ? `<p>${product.desc}</p>` : ''}
    <p><strong>Precio:</strong> ${formatCurrency(product.price)}</p>
    <button class="btn-primary" id="addFromModal">Añadir al carrito</button>
  `;
  document.body.classList.add("modal-open");
  modal.hidden = false;
  document.getElementById('addFromModal').onclick = () => {
    addToCart(product.id);
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };
}



function renderProducts() {
  const grid = $('#productsGrid');
  grid.innerHTML = '';
  // filter + search
  let list = PRODUCTS.slice();
  if (state.category && state.category !== 'all') {
    list = list.filter(p => p.category === state.category);
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(p => (p.name + ' ' + p.category).toLowerCase().includes(q));
  }
  // sort
  if (state.sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  if (state.sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
  // render
  if (list.length === 0) {
    grid.innerHTML = `<p class="center">No se encontraron productos.</p>`;
    return;
  }
  list.forEach(p => grid.appendChild(createProductCard(p)));
}

function renderAccessories() {
  const container = $('#accessoriesGrid');
  container.innerHTML = '';
  PRODUCTS.filter(p => p.category === 'Accesorio' || p.category === 'MIDI').forEach(p => {
    container.appendChild(createProductCard(p));
  });
}

// ---------- ORDER / CHECKOUT ----------
function renderOrderSummary() {
  const items = $('#orderItems');
  items.innerHTML = '';
  if (state.cart.length === 0) {
    items.innerHTML = '<p>Tu carrito está vacío.</p>';
  } else {
    state.cart.forEach(ci => {
      const prod = PRODUCTS.find(p => p.id === ci.id);
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `<div class="meta"><strong>${prod.name}</strong><div class="small">${formatCurrency(prod.price)} x ${ci.qty}</div></div>`;
      items.appendChild(div);
    });
  }
  const t = cartTotals();
  $('#orderTotals').innerHTML = `
    <div>Subtotal: ${formatCurrency(t.subtotal)}</div>
    <div>IVA (${(IVA*100).toFixed(0)}%): ${formatCurrency(t.iva)}</div>
    <div><strong>Total: ${formatCurrency(t.total)}</strong></div>
  `;
}

// handle checkout submit
function handleCheckoutSubmit() {
  const name = $('#fullName').value.trim();
  const email = $('#email').value.trim();
  const address = $('#address').value.trim();
  const card = $('#cardNumber').value.trim();
  if (!name || !email || !address || !card) {
    $('#checkoutFeedback').textContent = 'Por favor completa todos los campos.';
    return;
  }
  if (state.cart.length === 0) {
    $('#checkoutFeedback').textContent = 'No hay productos en el carrito.';
    return;
  }
  // simulate success
  const totals = cartTotals();
  const orderId = 'SON-' + Date.now().toString(36).slice(-6).toUpperCase();
  $('#checkoutFeedback').textContent = `¡Pedido confirmado! ID: ${orderId}. Total ${formatCurrency(totals.total)}.`;
  // clear cart
  state.cart = [];
  persistCart();
  updateCartUI();
  // clear form
  $('#checkoutForm').reset();
  renderOrderSummary();
  setTimeout(() => navigateTo('/'), 2500);
}

// ---------- RENDER INITIAL FEATURED + PRODUCTS ON LOAD ----------
function renderInitial() {
  renderFeatured();
  renderProducts();
  updateCartUI();
}


// ---------- ON LOAD: init listeners and UI updates ----------
(function init() {
  // listen clicks on nav links to keep SPA behavior
// dentro de init()
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-route]');
  if (a) {
    e.preventDefault();
    const route = a.getAttribute('href') || a.dataset.route;
    navigateTo(route.replace(/^#/, ''));
  }
});

  // keep header compact when scrolling
  window.addEventListener('scroll', () => {
    document.querySelector('.site-header').classList.toggle('scrolled', window.scrollY > 40);
  });

  // initial render already invoked by load handler
})();

// === Cerrar carrito al hacer clic fuera ===
document.addEventListener("click", (e) => {
  const cartPanel = document.getElementById("cartPanel");
  const cartToggle = document.getElementById("cartToggle");

  // Si el panel está abierto y el clic no fue dentro del panel ni en el botón del carrito:
  if (cartPanel.classList.contains("open") && 
      !cartPanel.contains(e.target) && 
      !cartToggle.contains(e.target)) {
    cartPanel.classList.remove("open");
    cartPanel.setAttribute("hidden", "");
    cartToggle.setAttribute("aria-expanded", "false");
  }
});


function highlightCart() {
  const cartBtn = document.getElementById('cartToggle');
  cartBtn.classList.add('pulse');
  setTimeout(() => cartBtn.classList.remove('pulse'), 600);
}

document.getElementById("goCheckoutBtn").addEventListener("click", () => {
  toggleCartPanel(false);
  openCheckoutModal();
});


/* ===== CHECKOUT MODAL: constantes, apertura, cierre, validación y éxito ===== */
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutFormModal = document.getElementById('checkoutFormModal');
const confirmBtn = document.getElementById('confirmOrderBtn');
const checkoutTotalsModal = document.getElementById('checkoutTotalsModal');
const checkoutFeedbackModal = document.getElementById('checkoutFeedbackModal');
const successModal = document.getElementById('successModal');
const successMsg = document.getElementById('successMsg');
const continueShopping = document.getElementById('continueShopping');

// Asegúrate de que elementos existan antes de usar
function safeAddListener(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

// Abrir modal checkout
function openCheckoutModal() {
  if (!checkoutModal) return;
  checkoutModal.hidden = false;
  document.body.classList.add('modal-open');
  // foco en primer input si existe
  const first = checkoutModal.querySelector('input, button, select, textarea');
  if (first) first.focus();
}

// Cerrar modal
function closeCheckoutModal() {
  if (!checkoutModal) return;
  checkoutModal.hidden = true;
  document.body.classList.remove('modal-open');
}

// Cerrar al hacer clic en overlay externo
safeAddListener(checkoutModal, 'click', (e) => {
  if (e.target === checkoutModal) closeCheckoutModal();
});

// close button
safeAddListener(closeCheckout, 'click', closeCheckoutModal);

// Renderizar totales en modal
function renderOrderSummaryModal() {
  const t = cartTotals();
  if (!checkoutTotalsModal) return;
  checkoutTotalsModal.innerHTML = `
    <div>Subtotal: ${formatCurrency(t.subtotal)}</div>
    <div>IVA: ${formatCurrency(t.iva)}</div>
    <div><strong>Total: ${formatCurrency(t.total)}</strong></div>
  `;
  // actualizar estado del botón de confirmar (si hay items)
  if (confirmBtn) confirmBtn.disabled = state.cart.length === 0;
}

// Validación básica en tiempo real del formulario modal
if (checkoutFormModal) {
  checkoutFormModal.addEventListener('input', () => {
    if (!confirmBtn) return;
    const valid = (
      (checkoutFormModal.querySelector('#fullName') || {value:''}).value.trim() &&
      (checkoutFormModal.querySelector('#email') || {value:''}).value.trim() &&
      (checkoutFormModal.querySelector('#address') || {value:''}).value.trim() &&
      (checkoutFormModal.querySelector('#cardNumber') || {value:''}).value.trim()
    );
    confirmBtn.disabled = !valid || state.cart.length === 0;
  });

  checkoutFormModal.addEventListener('submit', (e) => {
    e.preventDefault();
    // double-check
    const name = (checkoutFormModal.querySelector('#fullName') || {value:''}).value.trim();
    const email = (checkoutFormModal.querySelector('#email') || {value:''}).value.trim();
    const address = (checkoutFormModal.querySelector('#address') || {value:''}).value.trim();
    const card = (checkoutFormModal.querySelector('#cardNumber') || {value:''}).value.trim();
    if (!name || !email || !address || !card) {
      if (checkoutFeedbackModal) checkoutFeedbackModal.textContent = 'Completa todos los campos.';
      return;
    }
    if (state.cart.length === 0) {
      if (checkoutFeedbackModal) checkoutFeedbackModal.textContent = 'No hay productos en el carrito.';
      return;
    }

    // Simular confirmar pedido
    const totals = cartTotals();
    const orderId = 'SON-' + Date.now().toString(36).slice(-6).toUpperCase();
    if (successMsg) successMsg.textContent = `ID: ${orderId} - Total ${formatCurrency(totals.total)}`;
    // vaciar carrito
    state.cart = [];
    persistCart();
    updateCartUI();
    // reset formulario
    checkoutFormModal.reset();
    closeCheckoutModal();
    if (successModal) successModal.hidden = false;
    document.body.classList.add('modal-open');
  });
}

// Continuar comprando (cerrar success)
safeAddListener(continueShopping, 'click', () => {
  if (successModal) successModal.hidden = true;
  document.body.classList.remove('modal-open');
});






// --- CONTROL DE SECCIONES SPA ---
const allSections = document.querySelectorAll("main > section");
const navLinks = document.querySelectorAll('nav a[data-route]');

function showPage(hash) {
  const route = hash.replace("#/", "") || "home";

  // Ocultar todas las secciones
  allSections.forEach(section => {
    section.style.display = "none";
    section.classList.remove("page--active");
  });

  // Quitar clase activa de todos los enlaces
  navLinks.forEach(link => link.classList.remove("active"));

  // --- RUTAS ---
  if (route === "home" || route === "") {
    // Mostrar inicio + secciones extra
    document.getElementById("home").style.display = "block";
    document.getElementById("home").classList.add("page--active");

    document.querySelectorAll(".home-extra").forEach(extra => {
      extra.style.display = "block";
    });

    // Activar enlace de inicio
    document.querySelector('a[data-route="/"]').classList.add("active");
  } 
  else if (route === "nosotros") {
    // Mostrar Nosotros + Contacto
    const nosotros = document.getElementById("nosotros");
    const contacto = document.getElementById("contacto");

    if (nosotros) {
      nosotros.style.display = "block";
      nosotros.classList.add("page--active");
    }
    if (contacto) {
      contacto.style.display = "block";
      contacto.classList.add("page--active");
    }

    // Activar enlace "Nosotros"
    document.querySelector('a[data-route="/nosotros"]').classList.add("active");
  }
  else {
    // Mostrar solo la sección seleccionada (productos, accesorios, etc.)
    const section = document.getElementById(route);
    if (section) {
      section.style.display = "block";
      section.classList.add("page--active");
    } else {
      location.hash = "#/";
    }

    // Activar enlace del menú correspondiente
    const activeLink = document.querySelector(`a[data-route="/${route}"]`);
    if (activeLink) activeLink.classList.add("active");
  }
}

// --- EVENTOS ---
// Detectar cambios en el hash
window.addEventListener("hashchange", () => showPage(location.hash));

// Ejecutar solo cuando el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) {
    location.hash = "#/";
  }
  showPage(location.hash);
});








