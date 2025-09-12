const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pedidoController = require("../controllers/pedidoController");

//Middlewares de validación
const {
  validarPedido,
  validarIdUsuario,
  validarIdPedido,
} = require("../middlewaress/validaciones");
const manejarValidaciones = require("../middlewaress/manejarValidaciones");

//Listar todos los pedidos
router.get("/", pedidoController.listarPedidos);

//Obtener pedido por ID
router.get(
  "/:id_pedido",
  validarIdPedido,
  manejarValidaciones,
  pedidoController.getPedido
);

//Actualizar pedido
router.put(
  "/:id_pedido",
  validarIdPedido,
  manejarValidaciones,
  pedidoController.actualizarPedido
);

//Eliminar pedido
router.delete(
  "/:id_pedido",
  validarIdPedido,
  manejarValidaciones,
  pedidoController.eliminarPedido
);

//Historial por usuario
router.get(
  "/historial/:id_usuario",
  validarIdUsuario,
  manejarValidaciones,
  pedidoController.getHistorial
);

//Crear un nuevo pedido
router.post(
  "/",
  validarPedido,
  manejarValidaciones,
  pedidoController.crearPedido
);

//Descargar factura Stripe o PayPal
router.get(
  "/factura/:id_pedido",
  validarIdPedido,
  manejarValidaciones,
  (req, res) => {
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
  }
);

module.exports = router;
