const { validationResult } = require("express-validator");

const manejarValidaciones = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      errores: errores.array().map((err) => ({
        campo: err.param,
        mensaje: err.msg,
      })),
    });
  }
  next();
};

module.exports = manejarValidaciones;
