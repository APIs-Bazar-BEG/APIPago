// models/Pedido.js
const db = require("../config/db");

const Pedido = {
  crearPedido: async (id_usuario, productos) => {
    // 1. Iniciar una transacción
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 2. Insertar el nuevo pedido en la tabla 'pedidos'
      const [pedidoResult] = await connection.query(
        "INSERT INTO pedidos (id_usuario, total, estado) VALUES (?, ?, ?)",
        [id_usuario, 0, "pendiente"]
      );
      const id_pedido = pedidoResult.insertId;

      let total = 0;

      // 3. Insertar cada producto en 'detalle_pedido'
      for (const producto of productos) {
        await connection.query(
          "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
          [id_pedido, producto.id, producto.cantidad, producto.precio]
        );
        total += producto.precio * producto.cantidad;
      }

      // 4. Actualizar el total del pedido
      await connection.query("UPDATE pedidos SET total = ? WHERE id = ?", [
        total,
        id_pedido,
      ]);

      // 5. Finalizar la transacción
      await connection.commit();
      connection.release();

      return { id: id_pedido, total: total };
    } catch (error) {
      // 6. Si algo falla, deshacer todos los cambios
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Función para obtener el historial de pedidos de un usuario
  getHistorial: async (id_usuario) => {
    const [rows] = await db.query(
      `SELECT p.id, p.fecha_creacion, p.estado, p.total, dp.nombre_producto, dp.cantidad
       FROM pedidos p
       INNER JOIN detalle_pedido dp ON p.id = dp.id_pedido
       WHERE p.id_usuario = ?
       ORDER BY p.fecha_creacion DESC`,
      [id_usuario]
    );
    return rows;
  },
};

module.exports = Pedido;
