const paypal = require("@paypal/checkout-server-sdk");
const client = require("../config/paypalClient");
const Pedido = require("../models/Pedido");

const paypalController = {
  // Crear pedido en BD y en PayPal
  crearPedido: async (req, res) => {
    try {
      const { id_usuario, productos } = req.body;

      if (!id_usuario || !productos || productos.length === 0) {
        return res.status(400).json({
          error: "Debe enviar id_usuario y al menos un producto válido",
        });
      }

      // Crear pedido en BD
      const nuevoPedido = await Pedido.crearPedido(id_usuario, productos);
      const total = nuevoPedido.total;

      // Crear orden en PayPal
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
            description: `Pedido #${nuevoPedido.id_pedido}`,
          },
        ],
      });

      const order = await client.execute(request);

      const approveLink = order.result.links.find(
        (link) => link.rel === "approve"
      );

      res.status(201).json({
        mensaje: "Orden creada correctamente en PayPal",
        id_pedido_interno: nuevoPedido.id_pedido,
        id_orden_paypal: order.result.id,
        url_aprobacion: approveLink ? approveLink.href : null,
      });
    } catch (error) {
      console.error("ERROR PAYPAL - crearPedido:", error);
      res.status(error.statusCode || 500).json({
        message: "Error al crear la orden de PayPal",
        details: error?.message || error,
      });
    }
  },

  // Capturar pago
  capturarPago: async (req, res) => {
    try {
      const { id_orden_paypal, id_pedido_interno } = req.body;

      if (!id_orden_paypal || !id_pedido_interno) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const request = new paypal.orders.OrdersCaptureRequest(id_orden_paypal);
      request.requestBody({});
      const capture = await client.execute(request);

      if (capture.result.status === "COMPLETED") {
        await Pedido.actualizarEstadoPedido(
          id_pedido_interno,
          "pagado",
          capture.result.id,
          "PayPal"
        );

        return res.status(200).json({
          mensaje: "Pago capturado correctamente",
          paypal_status: capture.result.status,
          id_transaccion: capture.result.id,
        });
      } else {
        await Pedido.actualizarEstadoPedido(
          id_pedido_interno,
          "cancelado",
          capture.result.id,
          "PayPal"
        );

        return res.status(400).json({
          mensaje: "El pago no se completó",
          paypal_status: capture.result.status,
        });
      }
    } catch (error) {
      console.error("ERROR PAYPAL - capturarPago:", error);
      res.status(error.statusCode || 500).json({
        message: "Error al capturar el pago de PayPal",
        details: error?.message || error,
      });
    }
  },
};

module.exports = paypalController;
