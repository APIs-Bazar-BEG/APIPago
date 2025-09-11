const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pedidoController = require("../controllers/pedidoController");

// Endpoint para crear un nuevo pedido
router.post("/", pedidoController.crearPedido);

// Endpoint para obtener el historial de pedidos de un usuario
router.get("/historial/:id_usuario", pedidoController.getHistorial);

// Descargar factura Stripe o PayPal
router.get("/factura/:id_pedido", (req, res) => {
  const id_pedido = req.params.id_pedido;

  const rutaFacturaStripe = path.join(
    __dirname,
    "../facturas",
    `factura_stripe_${id_pedido}.pdf`
  );
  const rutaFacturaPaypal = path.join(
    __dirname,
    "../facturas",
    `factura_paypal_${id_pedido}.pdf`
  );

  let rutaFactura = null;

  if (fs.existsSync(rutaFacturaStripe)) rutaFactura = rutaFacturaStripe;
  else if (fs.existsSync(rutaFacturaPaypal)) rutaFactura = rutaFacturaPaypal;

  if (!rutaFactura)
    return res.status(404).json({ error: "Factura no encontrada" });

  res.sendFile(rutaFactura);
});

module.exports = router;
