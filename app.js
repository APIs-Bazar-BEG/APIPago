// app.js
const express = require("express");
const app = express();
const port = 3001;

// Importar el módulo de conexión a la base de datos
const db = require("./config/db");

// Importar las rutas de pedidos
const pedidosRouter = require("./routes/pedidos");

// Middleware para procesar JSON en las solicitudes
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API de Pedidos y Pagos en funcionamiento!");
});

// Usar las rutas de pedidos
app.use("/api/v1/pedidos", pedidosRouter);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
