const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");
const paypalController = require("../controllers/paypalController");

// Rutas de Stripe
router.post("/stripe/crear-intencion", pagoController.crearIntencionPago);
router.post("/stripe/confirmar-pago", pagoController.confirmarPago);

// Crear orden PayPal
router.post("/paypal/crear-pedido", paypalController.crearPedido);
router.post("/paypal/capturar-pago", paypalController.capturarPago);
module.exports = router;
