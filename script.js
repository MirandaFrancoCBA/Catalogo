let productosOriginales = [];

// Formatear precio
function formatoPrecio(valor) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(valor);
  } catch {
    return `$${valor}`;
  }
}

// Renderizar productos
function renderProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  contenedor.innerHTML = "";

  if (!lista.length) {
    const vacio = document.createElement("div");
    vacio.className = "empty";
    vacio.textContent = "No hay productos que coincidan con la búsqueda.";
    contenedor.appendChild(vacio);
    return;
  }

  lista.forEach((prod, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="img/${prod.imagenes[0]}" alt="${prod.nombre}" class="card-img">
      <div class="card-body">
        <h3 class="card-title">${prod.nombre}</h3>
        <p class="card-desc">${prod.descripcion || ""}</p>
        <p class="card-price"><strong>${formatoPrecio(prod.precio)}</strong></p>
      </div>
    `;
    contenedor.appendChild(card);

    setTimeout(() => card.classList.add("show"), 50);
    // Click para abrir modal
    card.addEventListener("click", () => abrirModal(prod));
  });
}

// Filtros y orden
function aplicarFiltros() {
  const query = document.getElementById("buscador")?.value.trim().toLowerCase() || "";
  const cat = document.getElementById("filtro-categoria")?.value || "";
  const min = parseFloat(document.getElementById("filtro-min")?.value) || 0;
  const max = parseFloat(document.getElementById("filtro-max")?.value) || Infinity;
  const orden = document.getElementById("filtro-orden")?.value || "";

  let filtrados = productosOriginales.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const desc = (p.descripcion || "").toLowerCase();
    const coincideBusqueda = !query || nombre.includes(query) || desc.includes(query);
    const coincideCat = !cat || p.categoria === cat;
    const coincidePrecio = p.precio >= min && p.precio <= max;
    return coincideBusqueda && coincideCat && coincidePrecio;
  });

  // Ordenamiento
  if (orden) {
    filtrados.sort((a, b) => {
      switch (orden) {
        case "precio-asc": return a.precio - b.precio;
        case "precio-desc": return b.precio - a.precio;
        case "nombre-asc": return a.nombre.localeCompare(b.nombre, "es");
        case "nombre-desc": return b.nombre.localeCompare(a.nombre, "es");
        default: return 0;
      }
    });
  }

  renderProductos(filtrados);
}

// Inicializar filtros
function initFiltros() {
  ["buscador", "filtro-categoria", "filtro-min", "filtro-max", "filtro-orden"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", aplicarFiltros);
    if (el && el.tagName === "SELECT") el.addEventListener("change", aplicarFiltros);
  });
}

// Cargar productos JSON
async function cargarProductos() {
  try {
    const res = await fetch("data/productos.json");
    productosOriginales = await res.json();

    // Rellenar categorías únicas
    const categorias = [...new Set(productosOriginales.map((p) => p.categoria))];
    const select = document.getElementById("filtro-categoria");
    categorias.forEach((c) => {
      if (!c) return;
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });

    renderProductos(productosOriginales);
    initFiltros();
  } catch (err) {
    console.error("Error cargando productos:", err);
    document.getElementById("catalogo").innerHTML =
      `<div class="empty">No se pudo cargar el catálogo.</div>`;
  }
}

// Tema oscuro
function initTema() {
  const btn = document.getElementById("btn-tema");
  if (!btn) return;

  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "dark") {
    document.body.classList.add("dark");
    btn.textContent = "☀️ Modo claro";
  }

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const esOscuro = document.body.classList.contains("dark");
    btn.textContent = esOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
    localStorage.setItem("tema", esOscuro ? "dark" : "light");
  });
}

// Modal y slider de imágenes
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
  modal.style.display = "flex";
  imagenesProducto = prod.imagenes || [];
  imagenActual = 0;
  actualizarImagen();
  modalNombre.textContent = prod.nombre;
  modalDescripcion.textContent = prod.descripcion || "";
  modalPrecio.textContent = formatoPrecio(prod.precio);
}

function actualizarImagen() {
  modalImg.src = `img/${imagenesProducto[imagenActual]}`;
}

modalClose.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

prevBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (imagenesProducto.length === 0) return;
  imagenActual = (imagenActual - 1 + imagenesProducto.length) % imagenesProducto.length;
  actualizarImagen();
});

nextBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (imagenesProducto.length === 0) return;
  imagenActual = (imagenActual + 1) % imagenesProducto.length;
  actualizarImagen();
});

// Inicialización
cargarProductos().then(initTema);