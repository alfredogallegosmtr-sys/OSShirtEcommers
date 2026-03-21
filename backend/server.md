# Servidor Principal (server.js)

## Descripción general

Este archivo es el punto de entrada del backend. Su función es inicializar y configurar un servidor utilizando Express, conectar la aplicación a una base de datos MongoDB y definir rutas básicas para responder a solicitudes HTTP.

---

## Código completo explicado

```js
// Importamos el framework Express
// Express permite crear servidores web y APIs de forma sencilla en Node.js
import express from 'express';

// Importamos dotenv
// dotenv se usa para cargar variables de entorno desde un archivo .env
import dotenv from 'dotenv';

// Importamos la función connectDB desde otro archivo
// Esta función se encarga de conectar la aplicación a MongoDB
import connectDB from './src/config/db.conf.js';

// Inicializamos dotenv
// Esto permite usar variables de entorno mediante process.env
dotenv.config();

// Creamos la aplicación de Express
// app será nuestro servidor
const app = express();

// Definimos el puerto en el que se ejecutará el servidor
// En este caso será http://localhost:3000
const port = 3000;

// Middleware para interpretar JSON
// Permite que el servidor entienda datos enviados en formato JSON
// Ejemplo: datos enviados desde Postman o un frontend
app.use(express.json());

// Ejecutamos la conexión a la base de datos
// Esta función intenta conectarse a MongoDB
// Si falla, la aplicación se detiene
connectDB();

// Definimos una ruta GET en la raíz "/"
// Cuando alguien accede a http://localhost:3000/
// el servidor responde con un mensaje
app.get('/', (req, res) => {
  res.send('API Ecommerce with MongoDB');
});

// Iniciamos el servidor
// app.listen hace que el servidor comience a escuchar peticiones
app.listen(port, () => {
  // Mostramos un mensaje en consola indicando que el servidor está corriendo
  console.log(`Server running on https://localhost:${port}`);
});