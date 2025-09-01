// script.js

// Contenedores e inputs
const grid = document.getElementById("catalogo");
const searchInput = document.getElementById("buscador");
const categoriaFiltro = document.getElementById("filtro-categoria");
const precioMinInput = document.getElementById("filtro-min");
const precioMaxInput = document.getElementById("filtro-max");
const ordenarSelect = document.getElementById("filtro-orden");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalNombre = document.getElementById("modal-nombre");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalPrecio = document.getElementById("modal-precio");
const modalClose = document.querySelector(".modal-close");
const btnTema = document.getElementById("btn-tema");
const langButtons = document.querySelectorAll(".lang-toggle button");

let productos = [];
let productosFiltrados = [];
let idioma = localStorage.getItem("idioma") || "es";
let temaOscuro = localStorage.getItem("temaOscuro") === "true";

// URL de Google Sheets CSV
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRipqgWxJuDRNca219T0SG4e1AM3cwJVix1xgd05gKXXhzOmpnL3KmrUExSXIE7Lpvo2tGvRmywR-w3/pub?output=csv";

// Traducciones
const traducciones = {
  es: { todas: "Todas" },
  en: { todas: "All" },
};

// Formatear precios
function formatoPrecio(precio) {
  return new Intl.NumberFormat(idioma === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(precio);
}

// Cargar productos desde Google Sheets
async function cargarProductos() {
  try {
    const response = await fetch(sheetUrl);
    const data = await response.text();
    const rows = data.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim().toLowerCase());

    productos = rows.slice(1).map(row => {
      let item = {};
      headers.forEach((h, i) => {
        if (h === "precio") item[h] = parseFloat(row[i]);
        else if (h === "imagenes") item[h] = row[i].split("|").map(url => url.trim());
        else item[h] = row[i].trim();
      });
      return item;
    });

    productosFiltrados = [...productos];
    mostrarProductos();
    cargarCategorias();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// Renderizar productos
function mostrarProductos() {
  grid.innerHTML = "";
  if (productosFiltrados.length === 0) {
    grid.innerHTML = `<div class="empty">No hay productos</div>`;
    return;
  }

  productosFiltrados.forEach(producto => {
    const card = document.createElement("div");
    card.className = "card show";

    card.innerHTML = `
      <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
      <div class="card-body">
        <h3>${producto.nombre}</h3>
        <p>${formatoPrecio(producto.precio)}</p>
      </div>
    `;

    card.addEventListener("click", () => abrirModal(producto));
    grid.appendChild(card);
  });
}

// Filtros
function aplicarFiltros() {
  const busqueda = searchInput.value.toLowerCase();
  const categoria = categoriaFiltro.value;
  const precioMin = parseFloat(precioMinInput.value) || 0;
  const precioMax = parseFloat(precioMaxInput.value) || Infinity;
  const orden = ordenarSelect.value;

  productosFiltrados = productos.filter(p => {
    return (
      (p.nombre.toLowerCase().includes(busqueda) ||
       p.descripcion.toLowerCase().includes(busqueda)) &&
      (categoria === "" || categoria === "todas" || p.categoria === categoria) &&
      p.precio >= precioMin &&
      p.precio <= precioMax
    );
  });

  if (orden === "precio-asc") productosFiltrados.sort((a, b) => a.precio - b.precio);
  if (orden === "precio-desc") productosFiltrados.sort((a, b) => b.precio - a.precio);
  if (orden === "nombre-asc") productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (orden === "nombre-desc") productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));

  mostrarProductos();
}

// Modal
function abrirModal(producto) {
  modal.classList.remove("hidden");
  let currentImage = 0;

  function renderImagen() {
    modalImg.src = producto.imagenes[currentImage];
    modalNombre.textContent = producto.nombre;
    modalDescripcion.textContent = producto.descripcion;
    modalPrecio.textContent = formatoPrecio(producto.precio);
  }

  renderImagen();

  document.getElementById("prev-img").onclick = () => {
    currentImage = (currentImage - 1 + producto.imagenes.length) % producto.imagenes.length;
    renderImagen();
  };
  document.getElementById("next-img").onclick = () => {
    currentImage = (currentImage + 1) % producto.imagenes.length;
    renderImagen();
  };
}

// Cerrar modal
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

// Cargar categorías
function cargarCategorias() {
  const categorias = [...new Set(productos.map(p => p.categoria))];
  categoriaFiltro.innerHTML = `<option value="todas">${traducciones[idioma].todas}</option>`;
  categorias.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoriaFiltro.appendChild(opt);
  });
}

// Dark mode
function aplicarTema() {
  document.body.classList.toggle("dark", temaOscuro);
}
btnTema.addEventListener("click", () => {
  temaOscuro = !temaOscuro;
  localStorage.setItem("temaOscuro", temaOscuro);
  aplicarTema();
});

// Cambio de idioma
langButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    idioma = btn.textContent.toLowerCase();
    localStorage.setItem("idioma", idioma);
    cargarCategorias();
    mostrarProductos();
  });
});

// Eventos filtros y búsqueda
searchInput.addEventListener("input", aplicarFiltros);
categoriaFiltro.addEventListener("change", aplicarFiltros);
precioMinInput.addEventListener("input", aplicarFiltros);
precioMaxInput.addEventListener("input", aplicarFiltros);
ordenarSelect.addEventListener("change", aplicarFiltros);

// Inicialización
aplicarTema();
cargarProductos();
