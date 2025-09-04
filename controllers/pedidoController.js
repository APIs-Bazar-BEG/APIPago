// controllers/pedidoController.js
const Pedido = require("../models/Pedido");

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
};

module.exports = pedidoController;
