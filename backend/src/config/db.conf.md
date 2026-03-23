# Conexión a MongoDB (db.conf.js)

## Descripción
Este archivo se encarga de establecer la conexión con la base de datos MongoDB usando Mongoose.  
Centraliza la lógica de conexión para que pueda ser reutilizada en toda la aplicación.

---

## Librería utilizada
- Mongoose: ODM para MongoDB en Node.js  
- Mongoose es un ODM (Object Data Modeling) que permite trabajar con MongoDB usando JavaScript de forma estructurada

---

## Funcionamiento

### 1. Importación
Se importa Mongoose para manejar la conexión y modelos de datos.

---

### 2. Función async
La función `connectDB` es asíncrona porque la conexión a la base de datos toma tiempo.

- Una función `async` siempre devuelve una Promesa
- Se utiliza `await` para esperar la respuesta de la conexión

---

### 3. Uso de try...catch (manejo de errores)

Se utiliza una estructura `try...catch` para manejar posibles errores durante la conexión.

#### ¿Por qué es necesario?

La conexión a la base de datos puede fallar por varias razones:
- MongoDB no está corriendo
- La URL es incorrecta
- El puerto es incorrecto
- Problemas de red

#### ¿Cómo funciona?

- `try`: contiene el código que puede fallar (la conexión)
- `catch`: captura el error y define qué hacer

Esto evita que la aplicación falle de forma inesperada y permite controlar el error de manera segura.

---

### 4. Conexión

Se utiliza:

mongoose.connect('mongodb://localhost:27017/ecommerce-OSShirts')


- `mongodb://` → protocolo  
- `localhost` → servidor local  
- `27017` → puerto por defecto  
- `ecommerce-OSShirts` → nombre de la base de datos  

`await` pausa la ejecución hasta que la conexión se complete.

---

### 5. Éxito

Si la conexión es exitosa, se muestra en consola:

MongoDB connected localhost

Esto indica que la base de datos está lista para usarse.

1. Primer connection
const connection = await mongoose.connect(...)

Aquí:

connection = el objeto que devuelve Mongoose
Es como un “wrapper” (contenedor)

2. Segundo connection
Este ya es:

La conexión real interna de MongoDB
Viene del driver nativo de MongoDB

Es como si fuera esto:

connection = {
  connection: {
    host: 'localhost',
    port: 27017,
    name: 'ecommerce-OSShirts'
  }
}

connection.connection.host

significa:

primer connection → objeto de Mongoose
segundo connection → conexión real
host → el servidor (localhost)

o visto de otra forma

caja.cajaInterna.host

caja externa → Mongoose
caja interna → MongoDB real

---

### 6. Error

Si ocurre un error durante la conexión:

- Se muestra un mensaje en consola:
  
  Error connecting MongoDB

- Se ejecuta:
  process.exit(1)

---

### 7. ¿Por qué usar process.exit(1)?

- `0` → ejecución exitosa  
- `1` → error  

Se utiliza `process.exit(1)` para detener completamente la aplicación cuando ocurre un error crítico.

#### ¿Por qué detener la app?

Porque sin conexión a la base de datos:
- No se pueden guardar datos  
- No se pueden consultar datos  
- La API no puede funcionar correctamente  

Esto sigue una práctica profesional llamada **"fail fast" (fallar rápido)**:
> Es mejor detener la aplicación inmediatamente que ejecutarla en un estado incorrecto.

---

## Flujo de ejecución

1. Se importa Mongoose  
2. Se define la función `connectDB`  
3. Se intenta conectar a MongoDB (`try`)  
4. Si funciona → se muestra mensaje de éxito  
5. Si falla → se captura el error (`catch`)  
6. Se muestra mensaje de error  
7. Se detiene la aplicación  

---

## Nota importante
La aplicación no debe ejecutarse sin conexión a la base de datos, ya que esto compromete completamente su funcionamiento.
