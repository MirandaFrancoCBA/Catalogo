import express from "express";
import cors from "cors";
import mercadopago from "mercadopago";

const app = express();
app.use(cors());
app.use(express.json());

mercadopago.configure({
  access_token: "TU_ACCESS_TOKEN"
});

app.post("/crear-pago", async (req, res) => {
  const items = req.body.items;

  const preference = {
    items: items.map(p => ({
      title: `${p.nombre} (${p.variante})`,
      unit_price: p.precio,
      quantity: p.cantidad
    }))
  };

  const response = await mercadopago.preferences.create(preference);

  res.json({ url: response.body.init_point });
});

app.listen(3000, () => console.log("Servidor listo 🚀"));