// routes/pedidos.js
const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");

// Endpoint para crear un nuevo pedido
router.post("/", pedidoController.crearPedido);

// Endpoint para obtener el historial de pedidos de un usuario
router.get("/historial/:id_usuario", pedidoController.getHistorial);

// Endpoint para generar una factura
router.get("/factura/:id_pedido", pedidoController.generarFactura);

module.exports = router;
