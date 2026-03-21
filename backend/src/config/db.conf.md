# Conexión a MongoDB (db.conf.js)

## Descripción
Este archivo se encarga de establecer la conexión con la base de datos MongoDB usando Mongoose.

## Librería utilizada
- Mongoose: ODM para MongoDB en Node.js
- Mongoose es un ODM (Object Data Modeling) que permite trabajar con MongoDB usando JavaScript de forma estructurada

## Funcionamiento

### 1. Importación
Se importa Mongoose para manejar la conexión y modelos de datos.

### 2. Función async
Intentamos conectar a MongoDB usando mongoose.connect().
La función `connectDB` es asíncrona porque la conexión a la base de datos toma tiempo.

### 3. Conexión
Se utiliza:
mongoose.connect('mongodb://localhost:27017/ecommerce-OSShirts')

- localhost → servidor local
- 27017 → puerto por defecto
- ecommerce-OSShirts → nombre de la base de datos

### 4. Éxito
Si conecta correctamente:

MongoDB connected localhost

### 5. Error
Si falla:
- Se muestra error en consola
- Se termina la aplicación con `process.exit(1)`

Terminamos la aplicación con código de error (1).
Entonces 0 = éxito, 1 = error

## Nota importante
La aplicación no debe ejecutarse sin conexión a la base de datos.
