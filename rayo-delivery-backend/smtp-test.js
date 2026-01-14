require('dotenv').config();
const nodemailer = require('nodemailer');

const to = process.argv[2];
if (!to) {
  console.error('Uso: node smtp-test.js destino@correo.com');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

console.log('Verificando configuración SMTP...');
transporter.verify()
  .then(() => {
    console.log('Conexión SMTP OK — intentando enviar correo de prueba a', to);
    return transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Prueba SMTP - Rayo Delivery',
      text: 'Este es un correo de prueba enviado desde smtp-test.js'
    });
  })
  .then(info => {
    console.log('Correo enviado correctamente:', info.response || info.accepted);
  })
  .catch(err => {
    console.error('Error en prueba SMTP:', err && err.message ? err.message : err);
    if (err && err.response) console.error('Respuesta SMTP:', err.response);
    process.exit(2);
  });
