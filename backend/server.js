import express from "express";
import cors from "cors";
import mercadopago from "mercadopago";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Servidor corriendo 🚀 en puerto", PORT));

const app = express();
app.use(cors());
app.use(express.json());

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// 👉 guardar pedido simple (archivo)
function guardarPedido(pedido) {
  let pedidos = [];

  try {
    pedidos = JSON.parse(fs.readFileSync("pedidos.json"));
  } catch {
    pedidos = [];
  }

  pedidos.push(pedido);
  fs.writeFileSync("pedidos.json", JSON.stringify(pedidos, null, 2));
}

// 👉 crear pago
app.post("/crear-pago", async (req, res) => {
  const { items } = req.body;

  const pedido = {
    id: Date.now(),
    items,
    fecha: new Date().toISOString()
  };

  guardarPedido(pedido);

  const preference = {
    items: items.map(p => ({
      title: `${p.nombre} (${p.variante})`,
      unit_price: p.precio,
      quantity: p.cantidad
    })),
    back_urls: {
      success: "https://mirandafrancocba.github.io/Catalogo/gracias.html",
      failure: "https://mirandafrancocba.github.io/Catalogo/error.html"
    },
    auto_return: "approved"
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    res.json({
      url: response.body.init_point,
      pedidoId: pedido.id
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creando pago");
  }
});

app.listen(3000, () => console.log("Servidor corriendo 🚀"));