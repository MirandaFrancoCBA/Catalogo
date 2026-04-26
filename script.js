let productosOriginales = [];

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let costoEnvio = 0;

/* =========================
   INIT (cuando carga DOM)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos().then(() => {
    initTema();
    renderCarrito();
    initCarritoToggle();
  });

  cambiarIdioma(idiomaActual);
});

/* =========================
   CARRITO
========================= */
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function initCarritoToggle() {
  const btn = document.getElementById("btn-carrito-toggle");
  const panel = document.getElementById("carrito-lateral");

  if (!btn || !panel) return;

  btn.onclick = () => panel.classList.toggle("open");
}

function agregarAlCarrito(prod) {
  let variante = prod.variantes[0];
  let precio = variante.crudo ?? variante.precio;

  carrito.push({
    id: prod.id,
    nombre: prod.nombre,
    variante: variante.tamano || variante.nombre,
    precio: precio,
    cantidad: 1
  });

  guardarCarrito();
  renderCarrito();
}

function renderCarrito() {
  const contenedor = document.getElementById("carrito-items");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "carrito-item";

    div.innerHTML = `
      <div class="carrito-top">
        <strong>${item.nombre}</strong>
        <button onclick="eliminarItem(${index})">✖</button>
      </div>

      <small>${item.variante}</small>

      <div class="carrito-bottom">
        <div class="cantidad-control">
          <button onclick="restarCantidad(${index})">−</button>
          <span>${item.cantidad}</span>
          <button onclick="sumarCantidad(${index})">+</button>
        </div>

        <div class="precio">
          ${formatoPrecio(item.precio * item.cantidad)}
        </div>
      </div>
    `;

    contenedor.appendChild(div);
  });

  actualizarTotales();
}

function cambiarCantidad(index, cantidad) {
  carrito[index].cantidad = parseInt(cantidad);
  guardarCarrito();
  renderCarrito();
}

function eliminarItem(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderCarrito();
}

/* =========================
   TOTALES
========================= */
function calcularSubtotal() {
  return carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
}

function actualizarTotales() {
  const subtotal = calcularSubtotal();
  const total = subtotal + costoEnvio;

  const subEl = document.getElementById("subtotal");
  const envEl = document.getElementById("envio");
  const totEl = document.getElementById("total");

  if (subEl) subEl.textContent = formatoPrecio(subtotal);
  if (envEl) envEl.textContent = formatoPrecio(costoEnvio);
  if (totEl) totEl.textContent = formatoPrecio(total);
}

/* =========================
   ENVÍO
========================= */
function calcularEnvio(cp) {
  if (!cp) return 0;
  if (cp.startsWith("5")) return 3000;
  if (cp.startsWith("1")) return 4000;
  return 5000;
}

function calcularEnvioUI() {
  const cp = document.getElementById("cp").value;
  costoEnvio = calcularEnvio(cp);

  document.getElementById("envio-texto").textContent =
    "Envío: " + formatoPrecio(costoEnvio);

  actualizarTotales();
}

/* =========================
   PAGO (WHATSAPP)
========================= */
async function pagar() {
  try {
    const res = await fetch("https://TU-BACKEND.onrender.com/crear-pago", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: carrito })
    });

    const data = await res.json();

    // guardamos el carrito para usarlo después
    localStorage.setItem("ultimoPedido", JSON.stringify(carrito));

    // redirige a MercadoPago
    window.location.href = data.url;

  } catch (err) {
    console.error("Error al iniciar pago:", err);
    alert("Hubo un problema al iniciar el pago");
  }
}

/* =========================
   PRODUCTOS
========================= */
function obtenerPrecioBase(prod) {
  if (!prod.variantes || !prod.variantes.length) return 0;

  if (prod.variantes[0].crudo !== undefined) {
    return Math.min(...prod.variantes.map(v => v.crudo));
  }

  return Math.min(...prod.variantes.map(v => v.precio));
}

function formatoPrecio(valor) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(valor);
  } catch {
    return `$${valor}`;
  }
}

function renderProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (!lista.length) {
    const vacio = document.createElement("div");
    vacio.className = "empty";
    vacio.textContent = textos[idiomaActual].vacio;
    contenedor.appendChild(vacio);
    return;
  }

  lista.forEach((prod, index) => {
    const card = document.createElement("div");
    card.className = "card col";

    card.innerHTML = `
      <img loading="lazy" src="img/${prod.imagenes[0]}" alt="${prod.nombre}" class="card-img">
      <div class="card-body">
        <h3>${prod.nombre}</h3>
        <p>${prod.descripcion || ""}</p>
        <p class="card-price"><strong>Desde ${formatoPrecio(obtenerPrecioBase(prod))}</strong></p>
        <button class="btn-agregar">Agregar</button>
      </div>
    `;

    contenedor.appendChild(card);
    setTimeout(() => card.classList.add("show"), index * 100);

    card.addEventListener("click", () => abrirModal(prod));

    card.querySelector(".btn-agregar").addEventListener("click", (e) => {
      e.stopPropagation();
      agregarAlCarrito(prod);
    });
  });
}

/* =========================
   FILTROS
========================= */
function aplicarFiltros() {
  const query = document.getElementById("buscador")?.value.toLowerCase() || "";
  const cat = document.getElementById("filtro-categoria")?.value || "";
  const tipo = document.getElementById("filtro-tipo")?.value || "";
  const estado = document.getElementById("filtro-estado")?.value || "";

  let filtrados = productosOriginales.filter((p) => {
    return (
      (!query || p.nombre.toLowerCase().includes(query)) &&
      (!cat || p.categoria === cat) &&
      (!tipo || p.tipo === tipo) &&
      (!estado || p.estado === estado)
    );
  });

  renderProductos(filtrados);
}

function initFiltros() {
  ["buscador","filtro-categoria","filtro-tipo","filtro-estado"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", aplicarFiltros);
  });
}

/* =========================
   CARGA
========================= */
async function cargarProductos() {
  try {
    const res = await fetch("data/productos.json");
    productosOriginales = await res.json();

    renderProductos(productosOriginales);
    initFiltros();
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   MODAL (FIX COMPLETO)
========================= */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalNombre = document.getElementById("modal-nombre");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalPrecio = document.getElementById("modal-precio");
const modalClose = document.querySelector(".modal-close");
const prevBtn = document.getElementById("prev-img");
const nextBtn = document.getElementById("next-img");

let imagenActual = 0;
let imagenesProducto = [];

function abrirModal(prod) {
  if (!modal) return;

  modal.classList.remove("hidden");

  imagenesProducto = prod.imagenes || [];
  imagenActual = 0;
  actualizarImagen();

  modalNombre.textContent = prod.nombre;
  modalDescripcion.textContent = prod.descripcion || "";

  // 🔥 GENERAR VARIANTES INTERACTIVAS
  if (prod.variantes[0].crudo !== undefined) {
    modalPrecio.innerHTML = prod.variantes.map((v, i) => `
      <div class="modal-variante">
        <strong>${v.tamano}cm</strong><br>

        <div class="variante-linea">
          🧱 ${formatoPrecio(v.crudo)}
          <button onclick="agregarVarianteAlCarrito(${prod.id}, ${i}, 'crudo')">+</button>
        </div>

        <div class="variante-linea">
          🎨 ${formatoPrecio(v.pintado)}
          <button onclick="agregarVarianteAlCarrito(${prod.id}, ${i}, 'pintado')">+</button>
        </div>
      </div>
    `).join("");
  } else {
    modalPrecio.innerHTML = prod.variantes.map((v, i) => `
      <div class="modal-variante">
        ${v.nombre} - ${formatoPrecio(v.precio)}
        <button onclick="agregarVarianteAlCarrito(${prod.id}, ${i})">+</button>
      </div>
    `).join("");
  }
}

function actualizarImagen() {
  if (imagenesProducto.length && modalImg) {
    modalImg.src = `img/${imagenesProducto[imagenActual]}`;
  }
}

if (modalClose) {
  modalClose.onclick = () => modal.classList.add("hidden");
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

if (prevBtn) {
  prevBtn.onclick = (e) => {
    e.stopPropagation();
    imagenActual = (imagenActual - 1 + imagenesProducto.length) % imagenesProducto.length;
    actualizarImagen();
  };
}

if (nextBtn) {
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    imagenActual = (imagenActual + 1) % imagenesProducto.length;
    actualizarImagen();
  };
}

/* =========================
   TEMA (FIX)
========================= */
function initTema() {
  const btn = document.getElementById("btn-tema");
  if (!btn) return;

  const temaGuardado = localStorage.getItem("tema");

  if (temaGuardado === "dark") {
    document.body.classList.add("dark");
    btn.textContent = "☀️ Modo claro";
  }

  btn.onclick = () => {
    document.body.classList.toggle("dark");

    const esOscuro = document.body.classList.contains("dark");
    btn.textContent = esOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";

    localStorage.setItem("tema", esOscuro ? "dark" : "light");
  };
}

/* =========================
   IDIOMA (FIX MINIMO)
========================= */
function cambiarIdioma(lang) {
  // versión simple para que no rompa
  console.log("Idioma cambiado a:", lang);
}

function agregarVarianteAlCarrito(prodId, varianteIndex, tipo = null) {
  const prod = productosOriginales.find(p => p.id === prodId);
  if (!prod) return;

  const variante = prod.variantes[varianteIndex];

  let precio;
  let nombreVariante;

  if (tipo === "crudo") {
    precio = variante.crudo;
    nombreVariante = `${variante.tamano}cm (Crudo)`;
  } else if (tipo === "pintado") {
    precio = variante.pintado;
    nombreVariante = `${variante.tamano}cm (Pintado)`;
  } else {
    precio = variante.precio;
    nombreVariante = variante.nombre;
  }

  const existente = carrito.find(item =>
    item.id === prod.id && item.variante === nombreVariante
  );
  
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      variante: nombreVariante,
      precio: precio,
      cantidad: 1
    });
  }

  guardarCarrito();
  renderCarrito();

  // feedback visual
  alert("Agregado al carrito 🛒");
}

function sumarCantidad(index) {
  carrito[index].cantidad++;
  guardarCarrito();
  renderCarrito();
}

function restarCantidad(index) {
  carrito[index].cantidad--;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  guardarCarrito();
  renderCarrito();
}