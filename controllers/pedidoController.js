//Controlador para manejar pedidos
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

      // Obtener los detalles del pedido desde la BD
      const detalles = await Pedido.getDetallePedido(id_pedido);

      if (!detalles || detalles.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      // Construir los items y calcular total
      let total = 0;
      const items = detalles.map((p) => {
        const total_item = p.precio_unitario * p.cantidad;
        total += total_item;
        return {
          nombre: p.nombre_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          total_item,
        };
      });

      const datosFactura = {
        id: id_pedido,
        total,
        items,
      };

      const rutaFactura = `./facturas/factura_${id_pedido}.pdf`;
      crearFactura(datosFactura, rutaFactura);

      res.status(200).json({
        mensaje: "Factura generada exitosamente",
        ruta: rutaFactura,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al generar la factura" });
    }
  },
};

module.exports = pedidoController;
