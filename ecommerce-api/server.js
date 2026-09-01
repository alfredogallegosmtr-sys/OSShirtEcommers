import dotenv from 'dotenv';
import connectDB from './src/config/db.conf.js';
import app from './src/app.js';

// .env.local (si existe) tiene prioridad -- pensado para apuntar a Mongo local en el día a
// día, dejando .env como el que queda apuntando a Atlas para cuando se necesite explícitamente
// (migraciones, probar contra datos reales). dotenv no sobreescribe una var ya seteada por un
// archivo anterior en la lista, así que cualquier variable que falte en .env.local cae a .env.
dotenv.config({ path: ['.env.local', '.env'] });

const port = process.env.PORT || 4001;

connectDB();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  }
);
