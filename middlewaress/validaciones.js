const { body, param } = require("express-validator");

//Validar creación de pedido
const validarPedido = [
  body("id_usuario")
    .notEmpty()
    .withMessage("El id_usuario es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El id_usuario debe ser un número entero válido"),

  body("productos")
    .isArray({ min: 1 })
    .withMessage("Debe enviar al menos un producto en el pedido"),

  body("productos.*.id_producto")
    .notEmpty()
    .withMessage("Cada producto debe tener un id_producto")
    .isInt({ min: 1 })
    .withMessage("El id_producto debe ser un número entero válido"),

  body("productos.*.cantidad")
    .notEmpty()
    .withMessage("Cada producto debe tener una cantidad")
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser mayor a 0"),

  body("productos.*.precio")
    .notEmpty()
    .withMessage("Cada producto debe tener un precio")
    .isFloat({ min: 0.01 })
    .withMessage("El precio debe ser mayor a 0"),
];

//Validar ID de pedido en parámetros
const validarIdPedido = [
  param("id_pedido")
    .notEmpty()
    .withMessage("El id_pedido es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El id_pedido debe ser un número entero válido"),
];

//Validar ID de usuario en parámetros
const validarIdUsuario = [
  param("id_usuario")
    .notEmpty()
    .withMessage("El id_usuario es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El id_usuario debe ser un número entero válido"),
];

module.exports = {
  validarPedido,
  validarIdPedido,
  validarIdUsuario,
};
