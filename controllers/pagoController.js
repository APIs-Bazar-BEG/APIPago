const axios = require("axios");
const ADMIN_API = process.env.ADMIN_API;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Pedido = require("../models/Pedido");
const { crearFactura } = require("../utils/generadorFacturas");
const fs = require("fs");
const path = require("path");

const pagoController = {
  // Crear intención de pago
  crearIntencionPago: async (req, res) => {
    try {
      const { id_usuario, productos } = req.body;
      // productos = [{ id_producto, cantidad }]

      if (!productos || productos.length === 0) {
        return res
          .status(400)
          .json({ error: "No hay productos en el pedido." });
      }

      // 🔥 Consultar detalles de productos desde Admin
      const ids = productos.map((p) => p.id_producto);
      const { data: productosAdmin } = await axios.get(
        `${ADMIN_API}/productos`,
        { params: { ids: ids.join(",") } } // asumiendo que Admin soporte filtro por ids
      );

      // Combinar info de cliente con precios/nombres de Admin
      const productosConInfo = productos.map((p) => {
        const info = productosAdmin.find((pa) => pa.id === p.id_producto);
        if (!info)
          throw new Error(`Producto ${p.id_producto} no encontrado en Admin`);
        return {
          ...p,
          nombre: info.nombre,
          precio_unitario: info.precio,
          categoria: info.categoria_nombre,
        };
      });

      // Calcular total
      const total = productosConInfo.reduce(
        (acc, p) => acc + p.precio_unitario * p.cantidad,
        0
      );

      // Guardar pedido en BD
      const nuevoPedido = await Pedido.crearPedido(
        id_usuario,
        productosConInfo
      );

      // Crear PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: { id_pedido: String(nuevoPedido.id_pedido) },
        automatic_payment_methods: { enabled: true },
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        id_pedido: nuevoPedido.id_pedido,
        total,
        productos: productosConInfo,
      });
    } catch (error) {
      console.error("ERROR EN CREAR INTENCIÓN:", error.message);
      res.status(500).json({ error: error.message });
    }
  },

  // Confirmar pago y generar factura
  // controllers/pagoController.js
  confirmarPago: async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Falta paymentIntentId" });
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: "pm_card_visa",
        }
      );

      const id_pedido = paymentIntent.metadata?.id_pedido;
      if (!id_pedido) {
        return res
          .status(400)
          .json({ error: "El PaymentIntent no tiene id_pedido en metadata" });
      }

      if (paymentIntent.status === "succeeded") {
        // ✅ Actualizar estado
        await Pedido.actualizarEstadoPedido(
          id_pedido,
          "pagado",
          paymentIntent.id,
          "Stripe"
        );

        // ✅ Vaciar carrito
        await Pedido.vaciarCarrito(id_pedido);

        // Obtener detalles (aunque ya no haya productos en detalle, los podemos usar de antes si quieres guardarlos en factura)
        const productos = await Pedido.getDetallePedido(id_pedido);
        const total = productos.reduce(
          (acc, p) => acc + p.precio_unitario * p.cantidad,
          0
        );

        // ✅ Generar factura
        const factura = {
          id: id_pedido,
          total,
          items: productos.map((p) => ({
            nombre: p.nombre_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
            total_item: p.cantidad * p.precio_unitario,
          })),
        };

        const rutaFactura = path.join(
          __dirname,
          "../facturas",
          `factura_stripe_${id_pedido}.pdf`
        );
        crearFactura(factura, rutaFactura);

        return res.status(200).json({
          mensaje: "Pago confirmado, carrito vaciado y factura generada.",
          paymentIntent,
          urlFactura: `http://localhost:3001/api/v1/pedidos/factura/${id_pedido}`,
        });
      } else {
        await Pedido.actualizarEstadoPedido(
          id_pedido,
          "cancelado",
          paymentIntent.id,
          "Stripe"
        );
        return res.status(400).json({
          mensaje: "Pago no completado",
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
