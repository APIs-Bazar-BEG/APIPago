const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

const config = {
  // Usamos la URI desde las variables de entorno
  uri: process.env.DB_URI,

  // Configuración SSL usando directamente el archivo ca.pem
  ssl: {
    ca: fs.readFileSync(__dirname + "/ca.pem"),
    rejectUnauthorized: true,
  },
};

const pool = mysql.createPool(config);

module.exports = pool.promise();
