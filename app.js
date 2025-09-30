// app.js
const express = require("express");
const app = express();
const port = 3001;

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Importar el módulo de conexión a la base de datos
const db = require("./config/db");

// Importar las rutas de pedidos y pagos
const pedidosRouter = require("./routes/pedidos");
const pagosRouter = require("./routes/pagos");

// Middleware para procesar JSON en las solicitudes
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API de Pedidos y Pagos en funcionamiento!");
});

// Usar las rutas
app.use("/api/v1/pedidos", pedidosRouter);
app.use("/api/v1/pagos", pagosRouter);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
