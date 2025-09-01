// script.js

const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const categoriaFiltro = document.getElementById("categoriaFiltro");
const precioMinInput = document.getElementById("precioMin");
const precioMaxInput = document.getElementById("precioMax");
const ordenarSelect = document.getElementById("ordenarSelect");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const toggleTema = document.getElementById("toggleTema");
const toggleLang = document.getElementById("toggleLang");

let productos = [];
let productosFiltrados = [];
let idioma = localStorage.getItem("idioma") || "es";
let temaOscuro = localStorage.getItem("temaOscuro") === "true";

// ✅ ID de tu Google Sheet
const sheetId = "TU_SHEET_ID"; 
const sheetUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRipqgWxJuDRNca219T0SG4e1AM3cwJVix1xgd05gKXXhzOmpnL3KmrUExSXIE7Lpvo2tGvRmywR-w3/pub?output=csv`;

// 📌 Traducciones
const traducciones = {
  es: {
    titulo: "Catálogo de Productos",
    buscar: "Buscar...",
    categoria: "Categoría",
    todas: "Todas",
    precioMin: "Precio Mín.",
    precioMax: "Precio Máx.",
    ordenar: "Ordenar por",
    nombreAsc: "Nombre (A-Z)",
    nombreDesc: "Nombre (Z-A)",
    precioAsc: "Precio (menor a mayor)",
    precioDesc: "Precio (mayor a menor)",
    cerrar: "Cerrar",
  },
  en: {
    titulo: "Product Catalog",
    buscar: "Search...",
    categoria: "Category",
    todas: "All",
    precioMin: "Min Price",
    precioMax: "Max Price",
    ordenar: "Sort by",
    nombreAsc: "Name (A-Z)",
    nombreDesc: "Name (Z-A)",
    precioAsc: "Price (low to high)",
    precioDesc: "Price (high to low)",
    cerrar: "Close",
  },
};

// 📌 Formatear precios
function formatoPrecio(precio) {
  return new Intl.NumberFormat(idioma === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(precio);
}

// 📌 Cargar productos desde Google Sheets
async function cargarProductos() {
  try {
    const response = await fetch(sheetUrl);
    const data = await response.text();
    const rows = data.split("\n").map(r => r.split(","));

    // primera fila = cabecera
    const headers = rows[0].map(h => h.trim().toLowerCase());
    productos = rows.slice(1).map(row => {
      let item = {};
      headers.forEach((h, i) => {
        if (h === "precio") {
          item[h] = parseFloat(row[i]);
        } else if (h === "imagenes") {
          item[h] = row[i].split("|").map(url => url.trim());
        } else {
          item[h] = row[i].trim();
        }
      });
      return item;
    });

    productosFiltrados = [...productos];
    mostrarProductos();
    cargarCategorias();
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// 📌 Renderizar productos
function mostrarProductos() {
  grid.innerHTML = "";
  productosFiltrados.forEach((producto, index) => {
    const card = document.createElement("div");
    card.className =
      "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 transform transition duration-300 hover:scale-105 cursor-pointer";
    card.style.animation = `fadeIn 0.5s ease forwards`;
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <img src="${producto.imagenes[0]}" alt="${producto.nombre}" class="w-full h-48 object-cover rounded-xl mb-3">
      <h3 class="text-lg font-semibold">${producto.nombre}</h3>
      <p class="text-gray-600 dark:text-gray-300">${formatoPrecio(producto.precio)}</p>
    `;

    card.addEventListener("click", () => abrirModal(producto));
    grid.appendChild(card);
  });
}

// 📌 Filtros
function aplicarFiltros() {
  const busqueda = searchInput.value.toLowerCase();
  const categoria = categoriaFiltro.value;
  const precioMin = parseFloat(precioMinInput.value) || 0;
  const precioMax = parseFloat(precioMaxInput.value) || Infinity;
  const orden = ordenarSelect.value;

  productosFiltrados = productos.filter((p) => {
    return (
      (p.nombre.toLowerCase().includes(busqueda) ||
        p.descripcion.toLowerCase().includes(busqueda)) &&
      (categoria === "todas" || p.categoria === categoria) &&
      p.precio >= precioMin &&
      p.precio <= precioMax
    );
  });

  if (orden === "nombreAsc") productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (orden === "nombreDesc") productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
  if (orden === "precioAsc") productosFiltrados.sort((a, b) => a.precio - b.precio);
  if (orden === "precioDesc") productosFiltrados.sort((a, b) => b.precio - a.precio);

  mostrarProductos();
}

// 📌 Modal
function abrirModal(producto) {
  modal.classList.remove("hidden");
  let currentImage = 0;

  function renderImagen() {
    modalBody.innerHTML = `
      <h2 class="text-2xl font-bold mb-2">${producto.nombre}</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">${formatoPrecio(producto.precio)}</p>
      <p class="mb-4">${producto.descripcion}</p>
      <div class="flex items-center justify-center">
        <button id="prevImg" class="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded-l">◀</button>
        <img src="${producto.imagenes[currentImage]}" class="max-h-80 mx-2 rounded-lg shadow">
        <button id="nextImg" class="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded-r">▶</button>
      </div>
    `;

    document.getElementById("prevImg").onclick = () => {
      currentImage = (currentImage - 1 + producto.imagenes.length) % producto.imagenes.length;
      renderImagen();
    };
    document.getElementById("nextImg").onclick = () => {
      currentImage = (currentImage + 1) % producto.imagenes.length;
      renderImagen();
    };
  }

  renderImagen();
}

modalClose.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

// 📌 Cargar categorías dinámicamente
function cargarCategorias() {
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  categoriaFiltro.innerHTML = `<option value="todas">${traducciones[idioma].todas}</option>`;
  categorias.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoriaFiltro.appendChild(option);
  });
}

// 📌 Traducción de la UI
function aplicarTraduccion() {
  document.getElementById("titulo").textContent = traducciones[idioma].titulo;
  searchInput.placeholder = traducciones[idioma].buscar;
  document.querySelector("label[for='categoriaFiltro']").textContent = traducciones[idioma].categoria;
  document.querySelector("label[for='precioMin']").textContent = traducciones[idioma].precioMin;
  document.querySelector("label[for='precioMax']").textContent = traducciones[idioma].precioMax;
  document.querySelector("label[for='ordenarSelect']").textContent = traducciones[idioma].ordenar;

  ordenarSelect.innerHTML = `
    <option value="nombreAsc">${traducciones[idioma].nombreAsc}</option>
    <option value="nombreDesc">${traducciones[idioma].nombreDesc}</option>
    <option value="precioAsc">${traducciones[idioma].precioAsc}</option>
    <option value="precioDesc">${traducciones[idioma].precioDesc}</option>
  `;
}

// 📌 Cambiar idioma
toggleLang.addEventListener("click", () => {
  idioma = idioma === "es" ? "en" : "es";
  localStorage.setItem("idioma", idioma);
  aplicarTraduccion();
  cargarCategorias();
  mostrarProductos();
});

// 📌 Tema oscuro
function aplicarTema() {
  document.documentElement.classList.toggle("dark", temaOscuro);
}
toggleTema.addEventListener("click", () => {
  temaOscuro = !temaOscuro;
  localStorage.setItem("temaOscuro", temaOscuro);
  aplicarTema();
});

// 📌 Eventos
searchInput.addEventListener("input", aplicarFiltros);
categoriaFiltro.addEventListener("change", aplicarFiltros);
precioMinInput.addEventListener("input", aplicarFiltros);
precioMaxInput.addEventListener("input", aplicarFiltros);
ordenarSelect.addEventListener("change", aplicarFiltros);

// 📌 Inicialización
aplicarTema();
aplicarTraduccion();
cargarProductos();
