async function cargarProductos() {
    const res = await fetch("data/productos.json");
    const productos = await res.json();
  
    const contenedor = document.getElementById("catalogo");
    contenedor.innerHTML = "";
  
    productos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="img/${prod.imagen}" alt="${prod.nombre}">
        <div class="card-body">
          <h3>${prod.nombre}</h3>
          <p>${prod.descripcion}</p>
          <p><strong>$${prod.precio}</strong></p>
        </div>
      `;
      contenedor.appendChild(card);
    });
  }
  
  cargarProductos();