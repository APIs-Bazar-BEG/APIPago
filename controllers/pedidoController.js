// controllers/pedidoController.js
const Pedido = require("../models/Pedido");
const { crearFactura } = require("../utils/generadorFacturas");

const pedidoController = {
  crearPedido: async (req, res) => {
    try {
      const { id_usuario, productos } = req.body;
      const nuevoPedido = await Pedido.crearPedido(id_usuario, productos);
      res.status(201).json(nuevoPedido);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear el pedido" });
    }
  },

  getHistorial: async (req, res) => {
    try {
      const { id_usuario } = req.params;
      const historial = await Pedido.getHistorial(id_usuario);
      res.json(historial);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error al obtener el historial de pedidos" });
    }
  },

  generarFactura: async (req, res) => {
    try {
      const { id_pedido } = req.params;

      // Aquí, harías una consulta a la base de datos para obtener los detalles del pedido
      // incluyendo los items, precios, etc. Por ahora, usaremos datos de ejemplo.
      const datosFactura = {
        id: id_pedido,
        total: 60.98,
        items: [
          {
            nombre: "Máscara de Pestañas",
            cantidad: 2,
            precio_unitario: 15.99,
            total_item: 31.98,
          },
          {
            nombre: "Eau de Parfum",
            cantidad: 1,
            precio_unitario: 45.0,
            total_item: 45.0,
          },
        ],
      };

      const rutaFactura = `./facturas/factura_${id_pedido}.pdf`;
      crearFactura(datosFactura, rutaFactura);

      res
        .status(200)
        .json({ mensaje: "Factura generada exitosamente", ruta: rutaFactura });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al generar la factura" });
    }
  },
};

module.exports = pedidoController;
