let productosOriginales = [];

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

  lista.forEach((prod) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="img/${prod.imagen}" alt="${prod.nombre}">
      <div class="card-body">
        <h3>${prod.nombre}</h3>
        <p>${prod.descripcion || ""}</p>
        <p><strong>${formatoPrecio(prod.precio)}</strong></p>
      </div>
    `;
    contenedor.appendChild(card);
  });
}

function aplicarFiltros() {
  const query = document.getElementById("buscador")?.value.trim().toLowerCase() || "";
  const cat = document.getElementById("filtro-categoria")?.value || "";
  const min = parseFloat(document.getElementById("filtro-min")?.value) || 0;
  const max = parseFloat(document.getElementById("filtro-max")?.value) || Infinity;

  const filtrados = productosOriginales.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const desc = (p.descripcion || "").toLowerCase();
    const coincideBusqueda = !query || nombre.includes(query) || desc.includes(query);
    const coincideCat = !cat || p.categoria === cat;
    const coincidePrecio = p.precio >= min && p.precio <= max;

    return coincideBusqueda && coincideCat && coincidePrecio;
  });

  renderProductos(filtrados);
}

function initFiltros() {
  const buscador = document.getElementById("buscador");
  const cat = document.getElementById("filtro-categoria");
  const min = document.getElementById("filtro-min");
  const max = document.getElementById("filtro-max");

  if (buscador) buscador.addEventListener("input", aplicarFiltros);
  if (cat) cat.addEventListener("change", aplicarFiltros);
  if (min) min.addEventListener("input", aplicarFiltros);
  if (max) max.addEventListener("input", aplicarFiltros);
}

async function cargarProductos() {
  try {
    const res = await fetch("data/productos.json");
    productosOriginales = await res.json();

    // rellenar categorías únicas en el <select>
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
    const contenedor = document.getElementById("catalogo");
    contenedor.innerHTML = `<div class="empty">No se pudo cargar el catálogo.</div>`;
  }
}

cargarProductos();