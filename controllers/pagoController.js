// controllers/pagoController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Pedido = require("../models/Pedido");

const pagoController = {
  // Crear intención de pago
  crearIntencionPago: async (req, res) => {
    try {
      const { id_usuario, productos } = req.body;

      if (!productos || productos.length === 0) {
        return res
          .status(400)
          .json({ error: "No hay productos en el pedido." });
      }

      // Calcular el total
      const total = productos.reduce(
        (acc, p) => acc + p.precio * p.cantidad,
        0
      );

      // Guardar el pedido en la base de datos
      const nuevoPedido = await Pedido.crearPedido(
        id_usuario,
        productos,
        total
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: { id_pedido: String(nuevoPedido.id_pedido) },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        id_pedido: nuevoPedido.id_pedido,
        urlFactura: `http://localhost:3001/api/v1/pedidos/factura/${nuevoPedido.id_pedido}`,
      });
    } catch (error) {
      console.error("ERROR EN CREAR INTENCIÓN:", error.message);
      res.status(500).json({ error: error.message });
    }
  },

  confirmarPago: async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Falta paymentIntentId" });
      }

      // Confirmar el pago directamente con tarjeta de prueba
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: "pm_card_visa", // modo sandbox
        }
      );

      console.log("PaymentIntent confirmado:", paymentIntent);

      const id_pedido = paymentIntent.metadata?.id_pedido;
      if (!id_pedido) {
        return res
          .status(400)
          .json({ error: "El PaymentIntent no tiene id_pedido en metadata" });
      }

      if (paymentIntent.status === "succeeded") {
        await Pedido.actualizarEstadoPedido(
          id_pedido,
          "pagado",
          paymentIntent.id,
          "Stripe"
        );
        return res.status(200).json({
          mensaje: "Pago confirmado y pedido actualizado.",
          paymentIntent,
        });
      } else {
        await Pedido.actualizarEstadoPedido(
          id_pedido,
          "cancelado",
          paymentIntent.id,
          "Stripe"
        );
        return res.status(400).json({
          mensaje: "El pago no se pudo completar.",
          estado: paymentIntent.status,
        });
      }
    } catch (error) {
      console.error("ERROR EN CONFIRMAR PAGO:", error.message);
      res.status(500).json({
        mensaje: "Error al confirmar el pago",
        detalles: error.message,
      });
    }
  },
};

module.exports = pagoController;
