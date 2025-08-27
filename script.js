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

// Renderizar productos con animación
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

    // Animación de aparición con retraso según índice
    setTimeout(() => card.classList.add("show"), index * 100);

    // Click para abrir modal
    card.addEventListener("click", () => abrirModal(prod));
  });
}

// Filtros y orden
function aplicarFiltros() {
  const query = document.getElementById("buscador")?.value.trim().toLowerCase() || "";
  const cat = document.getElementById("filtro-categoria")?.value || "";
  const tipo = document.getElementById("filtro-tipo")?.value || "";
  const estado = document.getElementById("filtro-estado")?.value || "";
  const min = parseFloat(document.getElementById("filtro-min")?.value) || 0;
  const max = parseFloat(document.getElementById("filtro-max")?.value) || Infinity;
  const orden = document.getElementById("filtro-orden")?.value || "";

  let filtrados = productosOriginales.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const desc = (p.descripcion || "").toLowerCase();
    const coincideBusqueda = !query || nombre.includes(query) || desc.includes(query);
    const coincideCat = !cat || p.categoria === cat;
    const coincideTipo = !tipo || p.tipo === tipo;
    const coincideEstado = !estado || (p.estado === estado);
    const coincidePrecio = p.precio >= min && p.precio <= max;
    return coincideBusqueda && coincideCat && coincideTipo && coincideEstado && coincidePrecio;
  });

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
  ["buscador", "filtro-categoria", "filtro-tipo", "filtro-estado", "filtro-min", "filtro-max", "filtro-orden"].forEach((id) => {
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
    const selectCat = document.getElementById("filtro-categoria");
    categorias.forEach((c) => {
      if (!c) return;
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      selectCat.appendChild(opt);
    });

    // Rellenar tipos únicos
    const tipos = [...new Set(productosOriginales.map(p => p.tipo).filter(Boolean))];
    const selectTipo = document.getElementById("filtro-tipo");
    tipos.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      selectTipo.appendChild(opt);
    });

    renderProductos(productosOriginales);
    initFiltros();

    // Aplicar idioma después de cargar productos
    cambiarIdioma(idiomaActual);

  } catch (err) {
    console.error("Error cargando productos:", err);
    document.getElementById("catalogo").innerHTML =
      `<div class="empty">${textos[idiomaActual].vacio}</div>`;
  }
}

// Tema oscuro
function initTema() {
  const btn = document.getElementById("btn-tema");
  if (!btn) return;

  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "dark") {
    document.body.classList.add("dark");
    btn.textContent = textos[idiomaActual].btnModoClaro;
  }

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const esOscuro = document.body.classList.contains("dark");
    btn.textContent = esOscuro ? textos[idiomaActual].btnModoClaro : textos[idiomaActual].btnModoOscuro;
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
  modal.classList.remove("hidden");
  imagenesProducto = prod.imagenes || [];
  imagenActual = 0;
  actualizarImagen();
  modalNombre.textContent = prod.nombre;
  modalDescripcion.textContent = prod.descripcion || "";
  modalPrecio.textContent = formatoPrecio(prod.precio);
}

function actualizarImagen() {
  if (imagenesProducto.length) {
    modalImg.src = `img/${imagenesProducto[imagenActual]}`;
  }
}

modalClose.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

prevBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (!imagenesProducto.length) return;
  imagenActual = (imagenActual - 1 + imagenesProducto.length) % imagenesProducto.length;
  actualizarImagen();
});

nextBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (!imagenesProducto.length) return;
  imagenActual = (imagenActual + 1) % imagenesProducto.length;
  actualizarImagen();
});

// Traducción
const textos = {
  es: {
    buscadorPlaceholder: "Buscar productos...",
    filtroCategoria: "Categoría:",
    filtroTipo: "Tipo:",
    filtroEstado: "Estado:",
    filtroMin: "Precio mín:",
    filtroMax: "Precio máx:",
    filtroOrden: "Ordenar por:",
    vacio: "No hay productos que coincidan con la búsqueda.",
    btnModoClaro: "☀️ Modo claro",
    btnModoOscuro: "🌙 Modo oscuro"
  },
  en: {
    buscadorPlaceholder: "Search products...",
    filtroCategoria: "Category:",
    filtroTipo: "Type:",
    filtroEstado: "State:",
    filtroMin: "Min price:",
    filtroMax: "Max price:",
    filtroOrden: "Sort by:",
    vacio: "No products match the search.",
    btnModoClaro: "☀️ Light mode",
    btnModoOscuro: "🌙 Dark mode"
  }
};

let idiomaActual = "es";

function cambiarIdioma(lang) {
  idiomaActual = lang;

  // placeholder buscador
  const buscador = document.getElementById("buscador");
  if (buscador) buscador.placeholder = textos[idiomaActual].buscadorPlaceholder;

  // labels filtros
  document.querySelectorAll("[data-texto]").forEach(el => {
    const key = el.dataset.texto;
    if (textos[idiomaActual][key]) {
      const span = el.querySelector("span");
      if(span){
        span.textContent = textos[idiomaActual][key];
      } else {
        el.childNodes[0].textContent = textos[idiomaActual][key] + " ";
      }
    }
  });

  // mensaje vacío
  const emptyDiv = document.querySelector(".empty");
  if (emptyDiv) emptyDiv.textContent = textos[idiomaActual].vacio;

  // botón de tema
  const btn = document.getElementById("btn-tema");
  if (btn) {
    const esOscuro = document.body.classList.contains("dark");
    btn.textContent = esOscuro ? textos[idiomaActual].btnModoClaro : textos[idiomaActual].btnModoOscuro;
  }

  // marcar botón activo
  document.querySelectorAll(".lang-toggle button").forEach(b => b.classList.remove("active"));
  const btnActivo = document.querySelector(`.lang-toggle button[onclick="cambiarIdioma('${idiomaActual}')"]`);
  if (btnActivo) btnActivo.classList.add("active");
}

// Inicialización
cargarProductos().then(initTema);
document.addEventListener("DOMContentLoaded", () => cambiarIdioma(idiomaActual));