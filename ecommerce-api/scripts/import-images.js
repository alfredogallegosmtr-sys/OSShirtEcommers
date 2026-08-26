import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SRC_ROOT = path.join(ROOT, "images");
const DEST_DIR = path.join(__dirname, "..", "public", "img", "products");

// slug -> carpeta de origen (relativa a images/), en el mismo orden que
// aparecen las subcategorías en src/seed/seed.js
const MAPPING = [
  ["anime-series", "Anime/Series"],
  ["anime-peliculas", "Anime/Peliculas"],
  ["anime-personajes", "Anime/Personajes"],
  ["anime-clasicos", "Anime/Clasicos"],
  ["anime-nuevos-lanzamientos", "Anime/Nuevos Lanzamientos"],

  ["manga", "MangaNovelas/manga"],
  ["novelas-ligeras", "MangaNovelas/novelas lijeras"],
  ["manhwa", "MangaNovelas/manhwa"],
  ["manga-personajes", "MangaNovelas/personajes"],
  ["autores", "MangaNovelas/autores"],

  ["cultura-japonesa", "Japon/Cultura Japonesa"],
  ["kanji", "Japon/kanji"],
  ["yokai", "Japon/yokai"],
  ["samurai", "Japon/samurai"],
  ["japon-tradicional", "Japon/japones_tradicional"],
  ["japon-moderno", "Japon/japon_modero"],

  ["k-pop", "Kpop/Kpop"],
  ["k-dramas", "Kpop/kDramas"],
  ["kculture-manhwa", "Kpop/Manhwa"],
  ["corea", "Kpop/Corea"],
  ["cultura-asiatica", "Kpop/CulturaAsiatica"],

  ["jrpg", "Videojuegos/JRGP"],
  ["nintendo", "Videojuegos/Nintendo"],
  ["playstation", "Videojuegos/Playstation"],
  ["retro", "Videojuegos/Retro"],
  ["gaming", "Videojuegos/Gaming"],

  ["marvel", "CulturaPop/Marvel"],
  ["dc", "CulturaPop/DC"],
  ["pop-peliculas", "CulturaPop/Peliculas"],
  ["pop-series", "CulturaPop/Series"],
  ["comics", "CulturaPop/Comics"],
  ["animacion", "CulturaPop/Animacion"],

  ["disenos-exclusivos", "Originales/DisenosExclusivos"],
  ["arte-original", "Originales/Arte Orginal"],
  ["colecciones-propias", "Originales/ColeccionesPropias"],

  ["nuevos", "Colecciones/Nuevos"],
  ["mas-vendidos", "Colecciones/Mas Vendidos"],
  ["ediciones-limitadas", "Colecciones/EdicionesLimitadas"],
  ["temporadas", "Colecciones/Temporadas"],
];

fs.mkdirSync(DEST_DIR, { recursive: true });

let counter = 1;
let totalCopied = 0;
const errors = [];

for (const [slug, relFolder] of MAPPING) {
  const srcFolder = path.join(SRC_ROOT, relFolder);
  if (!fs.existsSync(srcFolder)) {
    errors.push(`Carpeta no encontrada: ${relFolder}`);
    counter += 5;
    continue;
  }

  const files = fs
    .readdirSync(srcFolder)
    .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b));

  if (files.length !== 5) {
    errors.push(`${relFolder}: se esperaban 5 imágenes, hay ${files.length}`);
  }

  for (let i = 0; i < 5; i++) {
    const file = files[i];
    const destName = `tshirt-${String(counter).padStart(2, "0")}.jpg`;
    if (file) {
      fs.copyFileSync(path.join(srcFolder, file), path.join(DEST_DIR, destName));
      totalCopied++;
    } else {
      errors.push(`Falta imagen #${i + 1} en ${relFolder} (destino ${destName})`);
    }
    counter++;
  }
}

console.log(`Copiadas ${totalCopied} imágenes a ${DEST_DIR}`);
if (errors.length) {
  console.log("\nAvisos:");
  errors.forEach((e) => console.log(" - " + e));
}
