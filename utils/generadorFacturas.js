// utils/generadorFacturas.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

function crearFactura(factura, ruta) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.pipe(fs.createWriteStream(ruta));

  generarEncabezado(doc, factura);
  generarDetallesFactura(doc, factura);
  generarTablaItems(doc, factura);
  generarPieDePagina(doc);

  doc.end();
}

function generarEncabezado(doc, factura) {
  doc.fontSize(20).text("FACTURA", 250, 45, { align: "right" }).moveDown();
}

function generarDetallesFactura(doc, factura) {
  doc
    .fontSize(10)
    .text(`ID de Factura: ${factura.id}`, 50, 80)
    .text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 50, 95)
    .text(`Monto Total: $${factura.total}`, 50, 110)
    .moveDown();
}

function generarTablaItems(doc, factura) {
  let y = 150;
  doc
    .fontSize(12)
    .text("Descripción", 50, y)
    .text("Cantidad", 250, y, { width: 100, align: "right" })
    .text("Precio", 350, y, { width: 100, align: "right" })
    .text("Total", 450, y, { width: 100, align: "right" })
    .moveDown();

  y += 20;

  factura.items.forEach((item) => {
    doc
      .fontSize(10)
      .text(item.nombre, 50, y)
      .text(item.cantidad.toString(), 250, y, { width: 100, align: "right" })
      .text(`$${item.precio_unitario}`, 350, y, { width: 100, align: "right" })
      .text(`$${item.total_item}`, 450, y, { width: 100, align: "right" });
    y += 20;
  });
}

function generarPieDePagina(doc) {
  doc
    .fontSize(10)
    .text("Gracias por su compra. Esperamos verlo de nuevo.", 50, 780, {
      align: "center",
      width: 500,
    });
}

module.exports = { crearFactura };
