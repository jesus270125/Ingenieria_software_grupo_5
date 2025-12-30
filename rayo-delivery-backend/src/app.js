 require('dotenv').config();

const port = process.env.PORT;
console.log("Servidor corriendo en el puerto:", port);

const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
require('./config/db');

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));

app.listen(process.env.PORT, () => {
    console.log("✔ Servidor iniciado en el puerto " + process.env.PORT);
});

app.use('/api/protected', require('./routes/protectedRoutes'));
