const paypal = require("@paypal/checkout-server-sdk");
const client = require("../config/paypalClient");
const Pedido = require("../models/Pedido");
const { crearFactura } = require("../utils/generadorFacturas");
const fs = require("fs");
const path = require("path");

const paypalController = {
  // Crear pedido en PayPal
  crearPedido: async (req, res) => {
    try {
      const { id_usuario, productos } = req.body;

      if (!productos || productos.length === 0) {
        return res
          .status(400)
          .json({ error: "Debe enviar al menos un producto" });
      }

      // Guardar pedido en BD
      const nuevoPedido = await Pedido.crearPedido(id_usuario, productos);
      const total = nuevoPedido.total;

      // Crear orden en PayPal
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: total.toFixed(2) },
            description: `Pedido #${nuevoPedido.id_pedido}`,
          },
        ],
      });

      const order = await client.execute(request);
      const approveLink = order.result.links.find(
        (link) => link.rel === "approve"
      );

      res.status(200).json({
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

  // Capturar pago y generar factura
  capturarPago: async (req, res) => {
    try {
      const { id_orden_paypal, id_pedido_interno } = req.body;

      if (!id_orden_paypal || !id_pedido_interno) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      // Capturar pago
      const request = new paypal.orders.OrdersCaptureRequest(id_orden_paypal);
      request.requestBody({});
      const capture = await client.execute(request);

      if (capture.result.status === "COMPLETED") {
        // Actualizar estado pedido
        await Pedido.actualizarEstadoPedido(
          id_pedido_interno,
          "pagado",
          capture.result.id,
          "PayPal"
        );

        // Obtener detalles del pedido para la factura
        const productos = await Pedido.getDetallePedido(id_pedido_interno);
        const total = productos.reduce(
          (acc, p) => acc + p.precio_unitario * p.cantidad,
          0
        );

        const factura = {
          id: id_pedido_interno,
          total,
          items: productos.map((p) => ({
            nombre: p.nombre_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
            total_item: p.cantidad * p.precio_unitario,
          })),
        };

        // Crear PDF de factura con la convención stripe_
        const rutaFactura = path.join(
          __dirname,
          "../facturas",
          `factura_stripe_${id_pedido_interno}.pdf`
        );

        crearFactura(factura, rutaFactura);

        res.status(200).json({
          mensaje: "Pago capturado correctamente",
          paypal_status: capture.result.status,
          id_transaccion: capture.result.id,
          urlFactura: `http://localhost:3001/api/v1/pedidos/factura/${id_pedido_interno}`,
        });
      } else {
        await Pedido.actualizarEstadoPedido(
          id_pedido_interno,
          "cancelado",
          capture.result.id,
          "PayPal"
        );

        res.status(400).json({
          mensaje: "El pago de PayPal no se pudo completar",
          estado: capture.result.status,
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
