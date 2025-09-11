const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pedidoController = require("../controllers/pedidoController");

// Endpoint para crear un nuevo pedido
router.post("/", pedidoController.crearPedido);

// Endpoint para obtener el historial de pedidos de un usuario
router.get("/historial/:id_usuario", pedidoController.getHistorial);

// Endpoint unificado para descargar factura
router.get("/factura/:id_pedido", (req, res) => {
  const id_pedido = req.params.id_pedido;

  // Priorizar PDF de Stripe, si no existe, buscar de PayPal
  let rutaFactura = path.join(
    __dirname,
    "../facturas",
    `factura_stripe_${id_pedido}.pdf`
  );

  if (!fs.existsSync(rutaFactura)) {
    rutaFactura = path.join(
      __dirname,
      "../facturas",
      `factura_paypal_${id_pedido}.pdf`
    );

    if (!fs.existsSync(rutaFactura)) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }
  }

  res.sendFile(rutaFactura);
});

module.exports = router;
