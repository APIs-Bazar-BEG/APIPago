// models/Pedido.js
const db = require("../config/db");

const Pedido = {
  crearPedido: async (id_usuario, productos) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Crear pedido
      const [pedidoResult] = await connection.query(
        "INSERT INTO pedidos (id_usuario, total, estado) VALUES (?, ?, ?)",
        [id_usuario, 0, "pendiente"]
      );
      const id_pedido = pedidoResult.insertId;

      let total = 0;
      for (const producto of productos) {
        await connection.query(
          "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
          [id_pedido, producto.id_producto, producto.cantidad, producto.precio]
        );
        total += producto.precio * producto.cantidad;
      }

      // Actualizar total del pedido
      await connection.query("UPDATE pedidos SET total = ? WHERE id = ?", [
        total,
        id_pedido,
      ]);

      await connection.commit();
      return { id_pedido, total };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  actualizarEstadoPedido: async (
    id_pedido,
    estado,
    id_transaccion,
    metodo_pago
  ) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Actualizar estado del pedido
      await connection.query("UPDATE pedidos SET estado = ? WHERE id = ?", [
        estado,
        id_pedido,
      ]);

      // Insertar pago si se proporcionó id_transaccion
      if (id_transaccion && metodo_pago) {
        const [pedido] = await connection.query(
          "SELECT total FROM pedidos WHERE id = ?",
          [id_pedido]
        );
        const monto = pedido[0]?.total || 0;

        await connection.query(
          "INSERT INTO pagos (id_pedido, id_transaccion, metodo_pago, monto) VALUES (?, ?, ?, ?)",
          [id_pedido, id_transaccion, metodo_pago, monto]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  getHistorial: async (id_usuario) => {
    try {
      const [rows] = await db.query(
        `SELECT p.id, p.fecha_creacion, p.estado, p.total, dp.id_producto, dp.cantidad, dp.precio_unitario, pr.nombre AS nombre_producto
         FROM pedidos p
         INNER JOIN detalle_pedido dp ON p.id = dp.id_pedido
         INNER JOIN BazarBEG_Cliente.productos pr ON dp.id_producto = pr.id
         WHERE p.id_usuario = ?
         ORDER BY p.fecha_creacion DESC`,
        [id_usuario]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getDetallePedido: async (id_pedido) => {
    try {
      const [rows] = await db.query(
        `SELECT dp.id_producto, dp.cantidad, dp.precio_unitario, pr.nombre AS nombre_producto
         FROM detalle_pedido dp
         INNER JOIN BazarBEG_Cliente.productos pr ON dp.id_producto = pr.id
         WHERE dp.id_pedido = ?`,
        [id_pedido]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getTodosPedidos: async () => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM pedidos ORDER BY fecha_creacion DESC"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  eliminarPedido: async (id_pedido) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      await connection.query("DELETE FROM detalle_pedido WHERE id_pedido = ?", [
        id_pedido,
      ]);
      await connection.query("DELETE FROM pagos WHERE id_pedido = ?", [
        id_pedido,
      ]);
      await connection.query("DELETE FROM pedidos WHERE id = ?", [id_pedido]);
      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  // Obtener pedido pendiente de un usuario
  getPedidoPendiente: async (id_usuario) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM pedidos WHERE id_usuario = ? AND estado = 'pendiente' LIMIT 1",
        [id_usuario]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Agregar producto a un pedido existente
  agregarProductoAPedido: async (
    id_pedido,
    { id_producto, cantidad, precio_unitario }
  ) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Insertar producto al detalle del pedido
      await connection.query(
        "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
        [id_pedido, id_producto, cantidad, precio_unitario]
      );

      // Recalcular total del pedido
      const [suma] = await connection.query(
        "SELECT SUM(cantidad * precio_unitario) AS total FROM detalle_pedido WHERE id_pedido = ?",
        [id_pedido]
      );
      const total = suma[0]?.total || 0;

      await connection.query("UPDATE pedidos SET total = ? WHERE id = ?", [
        total,
        id_pedido,
      ]);

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  vaciarCarrito: async (id_pedido) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Eliminar los productos del carrito
      await connection.query("DELETE FROM detalle_pedido WHERE id_pedido = ?", [
        id_pedido,
      ]);

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },
};

module.exports = Pedido;
