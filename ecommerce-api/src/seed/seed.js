import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.conf.js";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Address from "../models/Address.js";
import PaymentMethod from "../models/PaymentMethod.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

dotenv.config();

// Las imágenes se sirven de forma estática desde el backend (server.js -> /img).
// La base se deriva del PORT del backend para que las URLs siempre coincidan.
const ASSET_BASE =
  process.env.ASSET_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
const img = (file) => `${ASSET_BASE}/img/products/${file}`;

// Por defecto el seed es NO destructivo: upsert por clave única (slug/email), nunca borra
// documentos existentes. SEED_ALLOW_RESET=true habilita el reset explícito (limpia y siembra
// desde cero) — ver docs/backlog.md para el detalle de esta regla.
const ALLOW_RESET = process.env.SEED_ALLOW_RESET === "true";

const seed = async () => {
  try {
    await connectDB();

    if (ALLOW_RESET) {
      // RESET EXPLÍCITO — solo si SEED_ALLOW_RESET=true
      await User.deleteMany();
      await Product.deleteMany();
      await Category.deleteMany();
      await Address.deleteMany();
      await PaymentMethod.deleteMany();
      await Cart.deleteMany();
      await Order.deleteMany();
      console.log("DB reset (SEED_ALLOW_RESET=true)");
    }

    // CATEGORÍAS RAÍZ (upsert por slug — no duplica en re-ejecuciones)
// =========================================================
// CATEGORÍAS RAÍZ
// =========================================================

const rootCategoriesData = [
  {
    name: "Anime",
    description: "Camisetas de series, películas y personajes de anime.",
    type: "anime",
    slug: "anime",
  },
  {
    name: "Manga & Novelas",
    description: "Camisetas inspiradas en manga, novelas ligeras, manhwa, personajes y autores.",
    type: "manga-novelas",
    slug: "manga-novelas",
  },
  {
    name: "Japón",
    description: "Camisetas inspiradas en la cultura, historia, arte y estilo de vida de Japón.",
    type: "japon",
    slug: "japon",
  },
  {
    name: "K-Pop & K-Culture",
    description: "Camisetas inspiradas en K-Pop, K-Dramas, manhwa y cultura coreana y asiática.",
    type: "kpop-culture",
    slug: "kpop-k-culture",
  },
  {
    name: "Videojuegos",
    description: "Camisetas inspiradas en videojuegos, consolas, personajes y cultura gaming.",
    type: "videojuegos",
    slug: "videojuegos",
  },
  {
    name: "Cultura Pop",
    description: "Camisetas inspiradas en películas, series, cómics, superhéroes y animación.",
    type: "cultura-pop",
    slug: "cultura-pop",
  },
  {
    name: "Originales",
    description: "Diseños exclusivos, arte original y colecciones creadas para nuestra tienda.",
    type: "originales",
    slug: "originales",
  },
  {
    name: "Colecciones",
    description: "Las novedades, productos más vendidos, ediciones limitadas y colecciones de temporada.",
    type: "colecciones",
    slug: "colecciones",
  },
];

const upsertCategory = async (data) =>
  Category.findOneAndUpdate(
    { slug: data.slug },
    { $setOnInsert: data },
    { upsert: true, returnDocument: "after" }
  );

const [anime, mangaNovelas, japon, kpopCulture, videojuegos, culturaPop, originales, colecciones] =
  await Promise.all(rootCategoriesData.map(upsertCategory));

// =========================================================
// SUBCATEGORÍAS (upsert por slug — no duplica en re-ejecuciones)
// =========================================================

const subCategoriesData = [

  // -------------------------
  // ANIME
  // -------------------------

  {
    name: "Series",
    description: "Camisetas inspiradas en series de anime.",
    type: "anime",
    slug: "anime-series",
    parentCategory: anime._id,
  },
  {
    name: "Películas",
    description: "Camisetas inspiradas en películas de anime.",
    type: "anime",
    slug: "anime-peliculas",
    parentCategory: anime._id,
  },
  {
    name: "Personajes",
    description: "Camisetas dedicadas a personajes populares del anime.",
    type: "anime",
    slug: "anime-personajes",
    parentCategory: anime._id,
  },
  {
    name: "Clásicos",
    description: "Camisetas inspiradas en los grandes clásicos del anime.",
    type: "anime",
    slug: "anime-clasicos",
    parentCategory: anime._id,
  },
  {
    name: "Nuevos Lanzamientos",
    description: "Camisetas inspiradas en los anime más recientes y populares.",
    type: "anime",
    slug: "anime-nuevos-lanzamientos",
    parentCategory: anime._id,
  },

  // -------------------------
  // MANGA & NOVELAS
  // -------------------------

  {
    name: "Manga",
    description: "Camisetas inspiradas en manga japonés.",
    type: "manga-novelas",
    slug: "manga",
    parentCategory: mangaNovelas._id,
  },
  {
    name: "Novelas Ligeras",
    description: "Camisetas inspiradas en novelas ligeras japonesas.",
    type: "manga-novelas",
    slug: "novelas-ligeras",
    parentCategory: mangaNovelas._id,
  },
  {
    name: "Manhwa",
    description: "Camisetas inspiradas en manhwa y webtoons coreanos.",
    type: "manga-novelas",
    slug: "manhwa",
    parentCategory: mangaNovelas._id,
  },
  {
    name: "Personajes",
    description: "Camisetas dedicadas a personajes destacados del manga y novelas.",
    type: "manga-novelas",
    slug: "manga-personajes",
    parentCategory: mangaNovelas._id,
  },
  {
    name: "Autores",
    description: "Camisetas inspiradas en autores y creadores de manga y novelas.",
    type: "manga-novelas",
    slug: "autores",
    parentCategory: mangaNovelas._id,
  },

  // JAPÓN
  {
    name: "Cultura Japonesa",
    description: "Diseños inspirados en la cultura y tradiciones de Japón.",
    type: "japon",
    slug: "cultura-japonesa",
    parentCategory: japon._id,
  },
  {
    name: "Kanji",
    description: "Diseños inspirados en caracteres kanji y la escritura japonesa.",
    type: "japon",
    slug: "kanji",
    parentCategory: japon._id,
  },
  {
    name: "Yokai",
    description: "Diseños inspirados en las criaturas y leyendas del folclore japonés.",
    type: "japon",
    slug: "yokai",
    parentCategory: japon._id,
  },
  {
    name: "Samurai",
    description: "Diseños inspirados en los samuráis, guerreros y estética del Japón feudal.",
    type: "japon",
    slug: "samurai",
    parentCategory: japon._id,
  },
  {
    name: "Japón Tradicional",
    description: "Diseños inspirados en el arte, arquitectura y estética tradicional japonesa.",
    type: "japon",
    slug: "japon-tradicional",
    parentCategory: japon._id,
  },
  {
    name: "Japón Moderno",
    description: "Diseños inspirados en la cultura urbana, tecnología y estética contemporánea de Japón.",
    type: "japon",
    slug: "japon-moderno",
    parentCategory: japon._id,
  },

  // K-POP & K-CULTURE
  {
    name: "K-Pop",
    description: "Diseños inspirados en la música y estética del K-Pop.",
    type: "kpop-culture",
    slug: "k-pop",
    parentCategory: kpopCulture._id,
  },
  {
    name: "K-Dramas",
    description: "Diseños inspirados en dramas y series de televisión coreanas.",
    type: "kpop-culture",
    slug: "k-dramas",
    parentCategory: kpopCulture._id,
  },
  {
    name: "Manhwa",
    description: "Diseños inspirados en manhwa y webtoons coreanos.",
    type: "kpop-culture",
    slug: "kculture-manhwa",
    parentCategory: kpopCulture._id,
  },
  {
    name: "Corea",
    description: "Diseños inspirados en Corea, su cultura, símbolos y estética.",
    type: "kpop-culture",
    slug: "corea",
    parentCategory: kpopCulture._id,
  },
  {
    name: "Cultura Asiática",
    description: "Diseños inspirados en diferentes elementos de la cultura asiática.",
    type: "kpop-culture",
    slug: "cultura-asiatica",
    parentCategory: kpopCulture._id,
  },
  // =======================================================
  // VIDEOJUEGOS
  // =======================================================

  {
    name: "JRPG",
    description: "Camisetas inspiradas en videojuegos japoneses de rol.",
    type: "videojuegos",
    slug: "jrpg",
    parentCategory: videojuegos._id,
  },
  {
    name: "Nintendo",
    description: "Camisetas inspiradas en personajes y videojuegos de Nintendo.",
    type: "videojuegos",
    slug: "nintendo",
    parentCategory: videojuegos._id,
  },
  {
    name: "PlayStation",
    description: "Camisetas inspiradas en videojuegos y personajes de PlayStation.",
    type: "videojuegos",
    slug: "playstation",
    parentCategory: videojuegos._id,
  },
  {
    name: "Retro",
    description: "Camisetas inspiradas en videojuegos clásicos y estética retro.",
    type: "videojuegos",
    slug: "retro",
    parentCategory: videojuegos._id,
  },
  {
    name: "Gaming",
    description: "Camisetas inspiradas en la cultura gamer y videojuegos.",
    type: "videojuegos",
    slug: "gaming",
    parentCategory: videojuegos._id,
  },

  // =======================================================
  // CULTURA POP
  // =======================================================

  {
    name: "Marvel",
    description: "Camisetas inspiradas en superhéroes y personajes de Marvel.",
    type: "cultura-pop",
    slug: "marvel",
    parentCategory: culturaPop._id,
  },
  {
    name: "DC",
    description: "Camisetas inspiradas en superhéroes y personajes de DC.",
    type: "cultura-pop",
    slug: "dc",
    parentCategory: culturaPop._id,
  },
  {
    name: "Películas",
    description: "Camisetas inspiradas en películas populares y clásicos del cine.",
    type: "cultura-pop",
    slug: "pop-peliculas",
    parentCategory: culturaPop._id,
  },
  {
    name: "Series",
    description: "Camisetas inspiradas en series de televisión y streaming.",
    type: "cultura-pop",
    slug: "pop-series",
    parentCategory: culturaPop._id,
  },
  {
    name: "Cómics",
    description: "Camisetas inspiradas en cómics y novelas gráficas.",
    type: "cultura-pop",
    slug: "comics",
    parentCategory: culturaPop._id,
  },
  {
    name: "Animación",
    description: "Camisetas inspiradas en películas y series de animación.",
    type: "cultura-pop",
    slug: "animacion",
    parentCategory: culturaPop._id,
  },
  // =======================================================
  // ORIGINALES
  // =======================================================

  {
    name: "Diseños Exclusivos",
    description: "Diseños exclusivos creados especialmente para nuestra tienda.",
    type: "originales",
    slug: "disenos-exclusivos",
    parentCategory: originales._id,
  },

  {
    name: "Arte Original",
    description: "Ilustraciones y propuestas artísticas originales para amantes del anime y la cultura pop.",
    type: "originales",
    slug: "arte-original",
    parentCategory: originales._id,
  },

  {
    name: "Colecciones Propias",
    description: "Colecciones originales desarrolladas con una identidad visual propia.",
    type: "originales",
    slug: "colecciones-propias",
    parentCategory: originales._id,
  },


  // =======================================================
  // COLECCIONES
  // =======================================================

  {
    name: "Nuevos",
    description: "Los diseños y productos más recientemente agregados a la tienda.",
    type: "colecciones",
    slug: "nuevos",
    parentCategory: colecciones._id,
  },

  {
    name: "Más Vendidos",
    description: "Los productos favoritos y más vendidos de nuestra comunidad.",
    type: "colecciones",
    slug: "mas-vendidos",
    parentCategory: colecciones._id,
  },

  {
    name: "Ediciones Limitadas",
    description: "Diseños especiales disponibles por tiempo o cantidades limitadas.",
    type: "colecciones",
    slug: "ediciones-limitadas",
    parentCategory: colecciones._id,
  },

  {
    name: "Temporadas",
    description: "Colecciones especiales inspiradas en diferentes épocas y temporadas del año.",
    type: "colecciones",
    slug: "temporadas",
    parentCategory: colecciones._id,
  },
];

const subCategories = await Promise.all(subCategoriesData.map(upsertCategory));

const cat = (slug) => {
  if (slug === "anime") return anime._id;
  if (slug === "manga-novelas") return mangaNovelas._id;
  if (slug === "japon") return japon._id;
  if (slug === "kpop-k-culture") return kpopCulture._id;
  if (slug === "videojuegos") return videojuegos._id;
  if (slug === "cultura-pop") return culturaPop._id;  
  if (slug === "originales") return originales._id;
  if (slug === "colecciones") return colecciones._id;  

  const category = subCategories.find((c) => c.slug === slug);

  if (!category) {
    throw new Error(`Categoría no encontrada: ${slug}`);
  }

  return category._id;
};

console.log("Categories created");

    // USERS (password hasheado para que el login funcione) — upsert por email.
    // $setOnInsert: si el usuario ya existe (p. ej. cambió su password real desde la app),
    // el seed no lo toca — solo crea lo que falta. user1 = admin, user2/user3 = los 2
    // customers mínimos pedidos; user4..user10 quedan para completar el catálogo demo del curso.
    const passwordHash = await bcrypt.hash("123456", 10);
    const users = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        User.findOneAndUpdate(
          { email: `user${i + 1}@test.com` },
          {
            $setOnInsert: {
              name: `User ${i + 1}`,
              email: `user${i + 1}@test.com`,
              password: passwordHash, // demo: todos usan "123456"
              role: i === 0 ? "admin" : "customer",
            },
          },
          { upsert: true, returnDocument: "after" }
        )
      )
    );

    console.log(
      "Users ready (login demo: user1@test.com / 123456, admin) — existentes no se modifican"
    );

    // PRODUCTS (slug explícito: insertMany no dispara el hook pre-save)
// =========================================================
// PRODUCTS
// 50 PRODUCTOS
// =========================================================

const productsData = [

  // =======================================================
  // ANIME - SERIES
  // =======================================================

  {
    name: "Naruto Hidden Leaf Tee",
    description: "Camiseta inspirada en la Aldea Oculta de la Hoja y el mundo ninja de Naruto.",
    price: 349,
    stock: 20,
    image: "tshirt-01.jpg",
    category: "anime-series",
    tags: ["anime", "naruto", "ninja", "series"],
  },

  {
    name: "One Piece Grand Line Tee",
    description: "Diseño inspirado en el espíritu aventurero de One Piece y la Grand Line.",
    price: 359,
    stock: 18,
    image: "tshirt-02.jpg",
    category: "anime-series",
    tags: ["anime", "one-piece", "pirates", "series"],
  },

  {
    name: "Dragon Ball Energy Tee",
    description: "Camiseta inspirada en la energía y las batallas del universo de Dragon Ball.",
    price: 359,
    stock: 22,
    image: "tshirt-03.jpg",
    category: "anime-series",
    tags: ["anime", "dragon-ball", "goku", "series"],
  },

  {
    name: "Jujutsu Kaisen Cursed Energy Tee",
    description: "Diseño inspirado en la energía maldita y el mundo sobrenatural de Jujutsu Kaisen.",
    price: 369,
    stock: 19,
    image: "tshirt-04.jpg",
    category: "anime-series",
    tags: ["anime", "jujutsu-kaisen", "sorcery", "series"],
  },

  {
    name: "Demon Slayer Corps Tee",
    description: "Camiseta inspirada en los cazadores de demonios y su estética tradicional japonesa.",
    price: 379,
    stock: 17,
    image: "tshirt-05.jpg",
    category: "anime-series",
    tags: ["anime", "demon-slayer", "kimetsu", "series"],
  },


  // =======================================================
  // ANIME - PELÍCULAS
  // =======================================================

  {
    name: "Spirited Away Tee",
    description: "Diseño inspirado en el mundo fantástico de El viaje de Chihiro.",
    price: 379,
    stock: 18,
    image: "tshirt-06.jpg",
    category: "anime-peliculas",
    tags: ["anime", "movie", "spirited-away", "ghibli"],
  },

  {
    name: "My Neighbor Totoro Tee",
    description: "Camiseta inspirada en la entrañable estética de Mi vecino Totoro.",
    price: 369,
    stock: 20,
    image: "tshirt-07.jpg",
    category: "anime-peliculas",
    tags: ["anime", "movie", "totoro", "ghibli"],
  },

  {
    name: "Your Name Sky Tee",
    description: "Diseño inspirado en los cielos y paisajes de la película Your Name.",
    price: 379,
    stock: 16,
    image: "tshirt-08.jpg",
    category: "anime-peliculas",
    tags: ["anime", "movie", "your-name", "romance"],
  },

  {
    name: "Weathering With You Tee",
    description: "Camiseta inspirada en la atmósfera urbana y celestial de Weathering With You.",
    price: 379,
    stock: 15,
    image: "tshirt-09.jpg",
    category: "anime-peliculas",
    tags: ["anime", "movie", "weathering-with-you"],
  },

  {
    name: "Akira Neo Tokyo Tee",
    description: "Diseño inspirado en la estética cyberpunk de Neo Tokyo y Akira.",
    price: 399,
    stock: 14,
    image: "tshirt-10.jpg",
    category: "anime-peliculas",
    tags: ["anime", "movie", "akira", "cyberpunk"],
  },


  // =======================================================
  // ANIME - PERSONAJES
  // =======================================================

  {
    name: "Naruto Sage Mode Character Tee",
    description: "Camiseta inspirada en Naruto durante su transformación de Modo Sabio.",
    price: 369,
    stock: 20,
    image: "tshirt-11.jpg",
    category: "anime-personajes",
    tags: ["anime", "naruto", "character", "sage-mode"],
  },

  {
    name: "Goku Super Saiyan Character Tee",
    description: "Diseño inspirado en Goku y su icónica transformación Super Saiyan.",
    price: 379,
    stock: 22,
    image: "tshirt-12.jpg",
    category: "anime-personajes",
    tags: ["anime", "dragon-ball", "goku", "super-saiyan"],
  },

  {
    name: "Monkey D. Luffy Character Tee",
    description: "Camiseta dedicada a Monkey D. Luffy y su espíritu de aventura.",
    price: 369,
    stock: 21,
    image: "tshirt-13.jpg",
    category: "anime-personajes",
    tags: ["anime", "one-piece", "luffy", "character"],
  },

  {
    name: "Gojo Satoru Character Tee",
    description: "Diseño inspirado en Satoru Gojo y su característica estética sobrenatural.",
    price: 379,
    stock: 19,
    image: "tshirt-14.jpg",
    category: "anime-personajes",
    tags: ["anime", "jujutsu-kaisen", "gojo", "character"],
  },

  {
    name: "Tanjiro Kamado Character Tee",
    description: "Camiseta inspirada en Tanjiro Kamado y su característico estilo de combate.",
    price: 379,
    stock: 18,
    image: "tshirt-15.jpg",
    category: "anime-personajes",
    tags: ["anime", "demon-slayer", "tanjiro", "character"],
  },


  // =======================================================
  // ANIME - CLÁSICOS
  // =======================================================

  {
    name: "Dragon Ball Classic Tee",
    description: "Camiseta inspirada en la estética clásica de Dragon Ball.",
    price: 349,
    stock: 25,
    image: "tshirt-16.jpg",
    category: "anime-clasicos",
    tags: ["anime", "classic", "dragon-ball", "retro"],
  },

  {
    name: "Sailor Moon Classic Tee",
    description: "Diseño inspirado en la estética clásica de Sailor Moon.",
    price: 359,
    stock: 20,
    image: "tshirt-17.jpg",
    category: "anime-clasicos",
    tags: ["anime", "classic", "sailor-moon", "retro"],
  },

  {
    name: "Neon Genesis Evangelion Classic Tee",
    description: "Camiseta inspirada en la estética futurista y psicológica de Evangelion.",
    price: 389,
    stock: 16,
    image: "tshirt-18.jpg",
    category: "anime-clasicos",
    tags: ["anime", "classic", "evangelion", "mecha"],
  },

  {
    name: "Cowboy Bebop Classic Tee",
    description: "Diseño inspirado en la estética espacial y noir de Cowboy Bebop.",
    price: 379,
    stock: 17,
    image: "tshirt-19.jpg",
    category: "anime-clasicos",
    tags: ["anime", "classic", "cowboy-bebop", "space"],
  },

  {
    name: "Yu Yu Hakusho Classic Tee",
    description: "Camiseta inspirada en el clásico anime de acción y sobrenatural Yu Yu Hakusho.",
    price: 359,
    stock: 15,
    image: "tshirt-20.jpg",
    category: "anime-clasicos",
    tags: ["anime", "classic", "yu-yu-hakusho", "retro"],
  },


  // =======================================================
  // ANIME - NUEVOS LANZAMIENTOS
  // =======================================================

  {
    name: "Kaiju No. 8 Defense Force Tee",
    description: "Diseño inspirado en la estética militar y kaiju de Kaiju No. 8.",
    price: 379,
    stock: 20,
    image: "tshirt-21.jpg",
    category: "anime-nuevos-lanzamientos",
    tags: ["anime", "new", "kaiju-no-8", "action"],
  },

  {
    name: "Solo Leveling Hunter Tee",
    description: "Camiseta inspirada en la estética oscura de los cazadores de Solo Leveling.",
    price: 389,
    stock: 18,
    image: "tshirt-22.jpg",
    category: "anime-nuevos-lanzamientos",
    tags: ["anime", "new", "solo-leveling", "hunter"],
  },

  {
    name: "Frieren Fantasy Journey Tee",
    description: "Diseño inspirado en el viaje fantástico y la estética de Frieren.",
    price: 379,
    stock: 16,
    image: "tshirt-23.jpg",
    category: "anime-nuevos-lanzamientos",
    tags: ["anime", "new", "frieren", "fantasy"],
  },

  {
    name: "Blue Lock Striker Tee",
    description: "Camiseta inspirada en la intensidad competitiva y el fútbol de Blue Lock.",
    price: 369,
    stock: 21,
    image: "tshirt-24.jpg",
    category: "anime-nuevos-lanzamientos",
    tags: ["anime", "new", "blue-lock", "sports"],
  },

  {
    name: "Chainsaw Man Devil Hunter Tee",
    description: "Diseño inspirado en la estética caótica y sobrenatural de Chainsaw Man.",
    price: 379,
    stock: 19,
    image: "tshirt-25.jpg",
    category: "anime-nuevos-lanzamientos",
    tags: ["anime", "new", "chainsaw-man", "action"],
  },


  // =======================================================
  // MANGA & NOVELAS - MANGA
  // =======================================================

  {
    name: "Manga Panel Streetwear Tee",
    description: "Camiseta inspirada en la composición visual de los paneles del manga japonés.",
    price: 349,
    stock: 25,
    image: "tshirt-26.jpg",
    category: "manga",
    tags: ["manga", "japan", "streetwear", "otaku"],
  },

  {
    name: "Manga Ink Illustration Tee",
    description: "Diseño inspirado en las ilustraciones realizadas con tinta y trazos tradicionales.",
    price: 339,
    stock: 22,
    image: "tshirt-27.jpg",
    category: "manga",
    tags: ["manga", "ink", "illustration", "japanese-art"],
  },

  {
    name: "Manga Volume Cover Tee",
    description: "Diseño inspirado en las clásicas portadas de volúmenes de manga.",
    price: 359,
    stock: 20,
    image: "tshirt-28.jpg",
    category: "manga",
    tags: ["manga", "volume", "cover", "japan"],
  },

  {
    name: "Black and White Manga Tee",
    description: "Camiseta minimalista inspirada en la característica estética monocromática del manga.",
    price: 329,
    stock: 24,
    image: "tshirt-29.jpg",
    category: "manga",
    tags: ["manga", "black-and-white", "minimal", "otaku"],
  },

  {
    name: "Manga Speed Lines Tee",
    description: "Diseño dinámico inspirado en las líneas de velocidad utilizadas en el manga de acción.",
    price: 339,
    stock: 21,
    image: "tshirt-30.jpg",
    category: "manga",
    tags: ["manga", "action", "speed-lines", "streetwear"],
  },


  // =======================================================
  // MANGA & NOVELAS - NOVELAS LIGERAS
  // =======================================================

  {
    name: "Light Novel Reader Tee",
    description: "Camiseta dedicada a los amantes de las novelas ligeras japonesas.",
    price: 329,
    stock: 22,
    image: "tshirt-31.jpg",
    category: "novelas-ligeras",
    tags: ["light-novel", "japan", "reader", "otaku"],
  },

  {
    name: "Isekai Adventure Novel Tee",
    description: "Diseño inspirado en las aventuras de mundos alternativos características del género isekai.",
    price: 349,
    stock: 20,
    image: "tshirt-32.jpg",
    category: "novelas-ligeras",
    tags: ["light-novel", "isekai", "fantasy", "adventure"],
  },

  {
    name: "Light Novel Fantasy Tee",
    description: "Camiseta inspirada en la estética fantástica de las novelas ligeras japonesas.",
    price: 349,
    stock: 18,
    image: "tshirt-33.jpg",
    category: "novelas-ligeras",
    tags: ["light-novel", "fantasy", "japan", "otaku"],
  },

  {
    name: "Otaku Book Club Tee",
    description: "Diseño inspirado en la cultura de lectura y colección de novelas ligeras.",
    price: 329,
    stock: 25,
    image: "tshirt-34.jpg",
    category: "novelas-ligeras",
    tags: ["light-novel", "books", "otaku", "reader"],
  },

  {
    name: "Isekai Portal Tee",
    description: "Diseño inspirado en los portales hacia mundos fantásticos del género isekai.",
    price: 359,
    stock: 19,
    image: "tshirt-35.jpg",
    category: "novelas-ligeras",
    tags: ["light-novel", "isekai", "portal", "fantasy"],
  },


  // =======================================================
  // MANGA & NOVELAS - MANHWA
  // =======================================================

  {
    name: "Manhwa Webtoon Style Tee",
    description: "Diseño inspirado en la estética moderna de los manhwa y webtoons coreanos.",
    price: 359,
    stock: 21,
    image: "tshirt-36.jpg",
    category: "manhwa",
    tags: ["manhwa", "webtoon", "korea", "streetwear"],
  },

  {
    name: "Manhwa Shadow Hunter Tee",
    description: "Camiseta inspirada en protagonistas de manhwa de acción y fantasía oscura.",
    price: 369,
    stock: 19,
    image: "tshirt-37.jpg",
    category: "manhwa",
    tags: ["manhwa", "action", "shadow", "fantasy"],
  },

  {
    name: "Korean Webtoon Panel Tee",
    description: "Diseño inspirado en la composición vertical y estética visual de los webtoons.",
    price: 349,
    stock: 23,
    image: "tshirt-38.jpg",
    category: "manhwa",
    tags: ["manhwa", "webtoon", "korea", "panel"],
  },

  {
    name: "Manhwa Tower Fantasy Tee",
    description: "Diseño inspirado en las historias de fantasía, torres y mundos sobrenaturales del manhwa.",
    price: 379,
    stock: 17,
    image: "tshirt-39.jpg",
    category: "manhwa",
    tags: ["manhwa", "tower", "fantasy", "korea"],
  },

  {
    name: "Manhwa Black Ink Tee",
    description: "Camiseta inspirada en ilustraciones oscuras y dramáticas del manhwa contemporáneo.",
    price: 359,
    stock: 20,
    image: "tshirt-40.jpg",
    category: "manhwa",
    tags: ["manhwa", "ink", "dark", "webtoon"],
  },


  // =======================================================
  // MANGA & NOVELAS - PERSONAJES
  // =======================================================

  {
    name: "Manga Hero Character Tee",
    description: "Diseño inspirado en los protagonistas clásicos del manga de acción.",
    price: 349,
    stock: 20,
    image: "tshirt-41.jpg",
    category: "manga-personajes",
    tags: ["manga", "character", "hero", "shonen"],
  },

  {
    name: "Manga Samurai Character Tee",
    description: "Camiseta inspirada en personajes samurái y la estética del Japón feudal.",
    price: 369,
    stock: 18,
    image: "tshirt-42.jpg",
    category: "manga-personajes",
    tags: ["manga", "samurai", "japan", "character"],
  },

  {
    name: "Manga Ronin Character Tee",
    description: "Diseño inspirado en la figura del ronin y los personajes de manga histórico.",
    price: 359,
    stock: 16,
    image: "tshirt-43.jpg",
    category: "manga-personajes",
    tags: ["manga", "ronin", "samurai", "character"],
  },

  {
    name: "Manga Fantasy Character Tee",
    description: "Camiseta inspirada en personajes de fantasía y aventuras de manga.",
    price: 359,
    stock: 21,
    image: "tshirt-44.jpg",
    category: "manga-personajes",
    tags: ["manga", "fantasy", "character", "adventure"],
  },

  {
    name: "Manga Villain Character Tee",
    description: "Diseño inspirado en la estética de los antagonistas memorables del manga.",
    price: 369,
    stock: 17,
    image: "tshirt-45.jpg",
    category: "manga-personajes",
    tags: ["manga", "villain", "character", "dark"],
  },


  // =======================================================
  // MANGA & NOVELAS - AUTORES
  // =======================================================

  {
    name: "Mangaka Studio Tee",
    description: "Camiseta inspirada en el proceso creativo de los mangaka y sus estudios de dibujo.",
    price: 329,
    stock: 24,
    image: "tshirt-46.jpg",
    category: "autores",
    tags: ["manga", "mangaka", "artist", "studio"],
  },

  {
    name: "Manga Creator Desk Tee",
    description: "Diseño inspirado en el espacio de trabajo tradicional de un creador de manga.",
    price: 329,
    stock: 22,
    image: "tshirt-47.jpg",
    category: "autores",
    tags: ["manga", "creator", "artist", "desk"],
  },

  {
    name: "Manga Artist Ink Tee",
    description: "Camiseta inspirada en las herramientas y técnicas de ilustración de los artistas de manga.",
    price: 339,
    stock: 20,
    image: "tshirt-48.jpg",
    category: "autores",
    tags: ["manga", "artist", "ink", "illustration"],
  },

  {
    name: "Japanese Manga Workshop Tee",
    description: "Diseño inspirado en un taller tradicional de creación e ilustración de manga.",
    price: 339,
    stock: 18,
    image: "tshirt-49.jpg",
    category: "autores",
    tags: ["manga", "japan", "workshop", "artist"],
  },

  {
    name: "Manga Creator Tribute Tee",
    description: "Diseño dedicado a la creatividad, dedicación y arte detrás de la creación del manga.",
    price: 349,
    stock: 20,
    image: "tshirt-50.jpg",
    category: "autores",
    tags: ["manga", "creator", "mangaka", "japan"],
  },

  // =========================================================
// JAPÓN — CULTURA JAPONESA
// =========================================================

{
  name: "Japanese Wave Tee",
  description: "Diseño inspirado en el arte japonés tradicional y la estética de las grandes olas.",
  price: 349,
  stock: 24,
  image: "tshirt-51.jpg",
  category: "cultura-japonesa",
  tags: ["japon", "japan", "culture", "traditional"],
},

{
  name: "Japanese Lantern Tee",
  description: "Camiseta inspirada en las tradicionales linternas japonesas y la arquitectura de Japón.",
  price: 339,
  stock: 21,
  image: "tshirt-52.jpg",
  category: "cultura-japonesa",
  tags: ["japon", "lantern", "culture", "japan"],
},

{
  name: "Torii Gate Sunset Tee",
  description: "Diseño inspirado en un torii japonés frente a un paisaje de atardecer.",
  price: 359,
  stock: 20,
  image: "tshirt-53.jpg",
  category: "cultura-japonesa",
  tags: ["japon", "torii", "shrine", "culture"],
},

{
  name: "Japanese Tea Ceremony Tee",
  description: "Camiseta inspirada en la ceremonia tradicional japonesa del té.",
  price: 349,
  stock: 18,
  image: "tshirt-54.jpg",
  category: "cultura-japonesa",
  tags: ["japon", "tea", "ceremony", "traditional"],
},

{
  name: "Japanese Culture Symbols Tee",
  description: "Diseño que combina diferentes símbolos representativos de la cultura japonesa.",
  price: 339,
  stock: 25,
  image: "tshirt-55.jpg",
  category: "cultura-japonesa",
  tags: ["japon", "symbols", "culture", "japan"],
},


// =========================================================
// JAPÓN — KANJI
// =========================================================

{
  name: "Kokoro 心 Kanji Tee",
  description: "Diseño minimalista inspirado en el kanji 心, asociado con corazón, mente y espíritu.",
  price: 329,
  stock: 25,
  image: "tshirt-56.jpg",
  category: "kanji",
  tags: ["japon", "kanji", "kokoro", "japanese"],
},

{
  name: "Yume 夢 Kanji Tee",
  description: "Camiseta inspirada en el kanji 夢, relacionado con los sueños y las aspiraciones.",
  price: 329,
  stock: 22,
  image: "tshirt-57.jpg",
  category: "kanji",
  tags: ["japon", "kanji", "yume", "dream"],
},

{
  name: "Kaze 風 Kanji Tee",
  description: "Diseño inspirado en el kanji 風, asociado con el viento y el movimiento.",
  price: 329,
  stock: 20,
  image: "tshirt-58.jpg",
  category: "kanji",
  tags: ["japon", "kanji", "kaze", "wind"],
},

{
  name: "Kizuna 絆 Kanji Tee",
  description: "Camiseta inspirada en el kanji 絆, relacionado con los lazos y conexiones entre personas.",
  price: 339,
  stock: 19,
  image: "tshirt-59.jpg",
  category: "kanji",
  tags: ["japon", "kanji", "kizuna", "bond"],
},

{
  name: "Bushido 武士道 Kanji Tee",
  description: "Diseño inspirado en el concepto de Bushido y la tradición de los guerreros japoneses.",
  price: 349,
  stock: 21,
  image: "tshirt-60.jpg",
  category: "kanji",
  tags: ["japon", "kanji", "bushido", "samurai"],
},


// =========================================================
// JAPÓN — YOKAI
// =========================================================

{
  name: "Kitsune Spirit Tee",
  description: "Diseño inspirado en los kitsune, espíritus zorro del folclore japonés.",
  price: 359,
  stock: 20,
  image: "tshirt-61.jpg",
  category: "yokai",
  tags: ["japon", "yokai", "kitsune", "folklore"],
},

{
  name: "Oni Mask Tee",
  description: "Camiseta inspirada en las máscaras oni y las criaturas del folclore japonés.",
  price: 359,
  stock: 22,
  image: "tshirt-62.jpg",
  category: "yokai",
  tags: ["japon", "yokai", "oni", "folklore"],
},

{
  name: "Tengu Mountain Spirit Tee",
  description: "Diseño inspirado en los tengu y las leyendas de las montañas japonesas.",
  price: 369,
  stock: 18,
  image: "tshirt-63.jpg",
  category: "yokai",
  tags: ["japon", "yokai", "tengu", "folklore"],
},

{
  name: "Kappa River Spirit Tee",
  description: "Camiseta inspirada en el kappa, una de las criaturas más conocidas del folclore japonés.",
  price: 349,
  stock: 21,
  image: "tshirt-64.jpg",
  category: "yokai",
  tags: ["japon", "yokai", "kappa", "folklore"],
},

{
  name: "Yokai Night Parade Tee",
  description: "Diseño inspirado en un desfile nocturno de criaturas sobrenaturales del folclore japonés.",
  price: 379,
  stock: 16,
  image: "tshirt-65.jpg",
  category: "yokai",
  tags: ["japon", "yokai", "night-parade", "folklore"],
},


// =========================================================
// JAPÓN — SAMURAI
// =========================================================

{
  name: "Samurai Warrior Tee",
  description: "Camiseta inspirada en la figura del guerrero samurái y su armadura tradicional.",
  price: 369,
  stock: 20,
  image: "tshirt-66.jpg",
  category: "samurai",
  tags: ["japon", "samurai", "warrior", "bushido"],
},

{
  name: "Ronin Warrior Tee",
  description: "Diseño inspirado en los ronin, samuráis sin señor del Japón feudal.",
  price: 369,
  stock: 18,
  image: "tshirt-67.jpg",
  category: "samurai",
  tags: ["japon", "samurai", "ronin", "warrior"],
},

{
  name: "Samurai Katana Tee",
  description: "Diseño centrado en la katana y la estética de los guerreros japoneses.",
  price: 359,
  stock: 22,
  image: "tshirt-68.jpg",
  category: "samurai",
  tags: ["japon", "samurai", "katana", "bushido"],
},

{
  name: "Samurai Sunset Tee",
  description: "Camiseta con estética cinematográfica inspirada en un samurái frente al atardecer.",
  price: 379,
  stock: 17,
  image: "tshirt-69.jpg",
  category: "samurai",
  tags: ["japon", "samurai", "sunset", "warrior"],
},

{
  name: "Bushido Warrior Tee",
  description: "Diseño inspirado en los valores asociados tradicionalmente con el Bushido.",
  price: 369,
  stock: 19,
  image: "tshirt-70.jpg",
  category: "samurai",
  tags: ["japon", "samurai", "bushido", "warrior"],
},


// =========================================================
// JAPÓN — JAPÓN TRADICIONAL
// =========================================================

{
  name: "Japanese Temple Tee",
  description: "Diseño inspirado en la arquitectura tradicional de los templos japoneses.",
  price: 349,
  stock: 23,
  image: "tshirt-71.jpg",
  category: "japon-tradicional",
  tags: ["japon", "temple", "traditional", "architecture"],
},

{
  name: "Mount Fuji Traditional Tee",
  description: "Camiseta inspirada en el Monte Fuji y los paisajes tradicionales japoneses.",
  price: 359,
  stock: 25,
  image: "tshirt-72.jpg",
  category: "japon-tradicional",
  tags: ["japon", "fuji", "traditional", "landscape"],
},

{
  name: "Japanese Sakura Tee",
  description: "Diseño inspirado en los cerezos en flor y la tradición del hanami.",
  price: 349,
  stock: 22,
  image: "tshirt-73.jpg",
  category: "japon-tradicional",
  tags: ["japon", "sakura", "hanami", "traditional"],
},

{
  name: "Japanese Woodblock Art Tee",
  description: "Diseño inspirado en el estilo visual de las estampas tradicionales japonesas.",
  price: 359,
  stock: 19,
  image: "tshirt-74.jpg",
  category: "japon-tradicional",
  tags: ["japon", "ukiyo-e", "art", "traditional"],
},

{
  name: "Japanese Garden Tee",
  description: "Camiseta inspirada en la estética tranquila y minimalista de los jardines japoneses.",
  price: 339,
  stock: 20,
  image: "tshirt-75.jpg",
  category: "japon-tradicional",
  tags: ["japon", "garden", "zen", "traditional"],
},


// =========================================================
// JAPÓN — JAPÓN MODERNO
// =========================================================

{
  name: "Tokyo Neon Nights Tee",
  description: "Diseño inspirado en las luces de neón y la energía nocturna de Tokio.",
  price: 379,
  stock: 22,
  image: "tshirt-76.jpg",
  category: "japon-moderno",
  tags: ["japon", "tokyo", "neon", "urban"],
},

{
  name: "Shibuya Crossing Tee",
  description: "Camiseta inspirada en uno de los paisajes urbanos más reconocibles de Tokio.",
  price: 369,
  stock: 20,
  image: "tshirt-77.jpg",
  category: "japon-moderno",
  tags: ["japon", "tokyo", "shibuya", "urban"],
},

{
  name: "Tokyo Cyberpunk Tee",
  description: "Diseño inspirado en una visión futurista y cyberpunk de Tokio.",
  price: 389,
  stock: 18,
  image: "tshirt-78.jpg",
  category: "japon-moderno",
  tags: ["japon", "tokyo", "cyberpunk", "future"],
},

{
  name: "Japanese Street Fashion Tee",
  description: "Camiseta inspirada en la moda urbana y las tendencias contemporáneas de Japón.",
  price: 359,
  stock: 24,
  image: "tshirt-79.jpg",
  category: "japon-moderno",
  tags: ["japon", "streetwear", "fashion", "tokyo"],
},

{
  name: "Tokyo Electric City Tee",
  description: "Diseño inspirado en la arquitectura, tecnología y estética urbana de la Tokio moderna.",
  price: 379,
  stock: 21,
  image: "tshirt-80.jpg",
  category: "japon-moderno",
  tags: ["japon", "tokyo", "technology", "urban"],
},


// =========================================================
// K-POP & K-CULTURE — K-POP
// =========================================================

{
  name: "K-Pop Neon Stage Tee",
  description: "Diseño inspirado en las luces, escenarios y estética visual del K-Pop.",
  price: 359,
  stock: 23,
  image: "tshirt-81.jpg",
  category: "k-pop",
  tags: ["kpop", "korea", "music", "stage"],
},

{
  name: "K-Pop Seoul Street Tee",
  description: "Camiseta inspirada en la combinación de K-Pop, moda urbana y calles de Seúl.",
  price: 369,
  stock: 20,
  image: "tshirt-82.jpg",
  category: "k-pop",
  tags: ["kpop", "seoul", "streetwear", "korea"],
},

{
  name: "K-Pop Music Wave Tee",
  description: "Diseño inspirado en la energía y estética contemporánea de la música coreana.",
  price: 349,
  stock: 25,
  image: "tshirt-83.jpg",
  category: "k-pop",
  tags: ["kpop", "music", "korea", "streetwear"],
},

{
  name: "Seoul Pop Culture Tee",
  description: "Camiseta inspirada en la cultura pop contemporánea de Seúl.",
  price: 359,
  stock: 21,
  image: "tshirt-84.jpg",
  category: "k-pop",
  tags: ["kpop", "seoul", "culture", "korea"],
},

{
  name: "K-Pop Heartbeat Tee",
  description: "Diseño inspirado en la energía, ritmo y estética visual de los escenarios de K-Pop.",
  price: 349,
  stock: 22,
  image: "tshirt-85.jpg",
  category: "k-pop",
  tags: ["kpop", "music", "heartbeat", "korea"],
},


// =========================================================
// K-POP & K-CULTURE — K-DRAMAS
// =========================================================

{
  name: "K-Drama Seoul Romance Tee",
  description: "Diseño inspirado en la estética romántica y urbana de los K-Dramas.",
  price: 349,
  stock: 20,
  image: "tshirt-86.jpg",
  category: "k-dramas",
  tags: ["kdrama", "korea", "romance", "seoul"],
},

{
  name: "K-Drama Night City Tee",
  description: "Camiseta inspirada en los paisajes nocturnos y cinematográficos de los dramas coreanos.",
  price: 359,
  stock: 18,
  image: "tshirt-87.jpg",
  category: "k-dramas",
  tags: ["kdrama", "korea", "night", "seoul"],
},

{
  name: "K-Drama Cafe Scene Tee",
  description: "Diseño inspirado en las cafeterías y escenas cotidianas características de los K-Dramas.",
  price: 339,
  stock: 24,
  image: "tshirt-88.jpg",
  category: "k-dramas",
  tags: ["kdrama", "cafe", "korea", "romance"],
},

{
  name: "K-Drama Seoul Love Tee",
  description: "Camiseta inspirada en las historias románticas y paisajes urbanos de Corea del Sur.",
  price: 349,
  stock: 21,
  image: "tshirt-89.jpg",
  category: "k-dramas",
  tags: ["kdrama", "romance", "seoul", "korea"],
},

{
  name: "K-Drama Cinematic Tee",
  description: "Diseño inspirado en la estética cinematográfica de las series coreanas.",
  price: 359,
  stock: 19,
  image: "tshirt-90.jpg",
  category: "k-dramas",
  tags: ["kdrama", "cinematic", "korea", "series"],
},


// =========================================================
// K-POP & K-CULTURE — MANHWA
// =========================================================

{
  name: "Manhwa Shadow Monarch Tee",
  description: "Diseño inspirado en la estética oscura de los protagonistas de manhwa de fantasía.",
  price: 379,
  stock: 20,
  image: "tshirt-91.jpg",
  category: "kculture-manhwa",
  tags: ["manhwa", "webtoon", "fantasy", "shadow"],
},

{
  name: "Korean Webtoon Hero Tee",
  description: "Camiseta inspirada en protagonistas de acción de los webtoons coreanos.",
  price: 359,
  stock: 22,
  image: "tshirt-92.jpg",
  category: "kculture-manhwa",
  tags: ["manhwa", "webtoon", "hero", "korea"],
},

{
  name: "Manhwa Fantasy World Tee",
  description: "Diseño inspirado en los mundos fantásticos y aventuras del manhwa coreano.",
  price: 369,
  stock: 18,
  image: "tshirt-93.jpg",
  category: "kculture-manhwa",
  tags: ["manhwa", "fantasy", "webtoon", "korea"],
},

{
  name: "K-Culture Webtoon Panel Tee",
  description: "Diseño inspirado en el formato visual de los paneles de webtoon.",
  price: 349,
  stock: 24,
  image: "tshirt-94.jpg",
  category: "kculture-manhwa",
  tags: ["manhwa", "webtoon", "panel", "korea"],
},

{
  name: "Manhwa Dark Fantasy Tee",
  description: "Camiseta inspirada en la estética oscura y dramática de los manhwa de fantasía.",
  price: 369,
  stock: 19,
  image: "tshirt-95.jpg",
  category: "kculture-manhwa",
  tags: ["manhwa", "dark", "fantasy", "webtoon"],
},


// =========================================================
// K-POP & K-CULTURE — COREA
// =========================================================

{
  name: "Seoul Skyline Tee",
  description: "Diseño inspirado en el skyline moderno de Seúl.",
  price: 349,
  stock: 25,
  image: "tshirt-96.jpg",
  category: "corea",
  tags: ["korea", "seoul", "skyline", "city"],
},

{
  name: "Korean Hangul Street Tee",
  description: "Camiseta inspirada en la escritura Hangul y la estética urbana coreana.",
  price: 339,
  stock: 23,
  image: "tshirt-97.jpg",
  category: "corea",
  tags: ["korea", "hangul", "seoul", "streetwear"],
},

{
  name: "Korean Tiger Heritage Tee",
  description: "Diseño inspirado en el tigre como elemento representativo del arte y folclore coreano.",
  price: 359,
  stock: 20,
  image: "tshirt-98.jpg",
  category: "corea",
  tags: ["korea", "tiger", "heritage", "culture"],
},

{
  name: "Seoul Traditional Meets Modern Tee",
  description: "Diseño que combina elementos tradicionales coreanos con una estética urbana moderna.",
  price: 369,
  stock: 18,
  image: "tshirt-99.jpg",
  category: "corea",
  tags: ["korea", "seoul", "traditional", "modern"],
},

{
  name: "Korean Street Culture Tee",
  description: "Camiseta inspirada en la moda urbana y cultura contemporánea de Corea del Sur.",
  price: 359,
  stock: 21,
  image: "tshirt-100.jpg",
  category: "corea",
  tags: ["korea", "streetwear", "culture", "seoul"],
},


// =========================================================
// K-POP & K-CULTURE — CULTURA ASIÁTICA
// =========================================================

{
  name: "Asian Night Market Tee",
  description: "Diseño inspirado en los mercados nocturnos y la cultura urbana de Asia.",
  price: 349,
  stock: 24,
  image: "tshirt-101.jpg",
  category: "cultura-asiatica",
  tags: ["asia", "asian-culture", "night-market", "streetwear"],
},

{
  name: "Asian Dragon Heritage Tee",
  description: "Camiseta inspirada en la simbología del dragón presente en diferentes culturas asiáticas.",
  price: 369,
  stock: 20,
  image: "tshirt-102.jpg",
  category: "cultura-asiatica",
  tags: ["asia", "dragon", "heritage", "culture"],
},

{
  name: "East Asian Street Culture Tee",
  description: "Diseño inspirado en la moda y cultura urbana de las principales ciudades de Asia Oriental.",
  price: 359,
  stock: 22,
  image: "tshirt-103.jpg",
  category: "cultura-asiatica",
  tags: ["asia", "streetwear", "culture", "urban"],
},

{
  name: "Asian Neon City Tee",
  description: "Camiseta inspirada en la estética de las grandes ciudades asiáticas iluminadas por neón.",
  price: 379,
  stock: 19,
  image: "tshirt-104.jpg",
  category: "cultura-asiatica",
  tags: ["asia", "neon", "city", "streetwear"],
},

{
  name: "Asian Culture Fusion Tee",
  description: "Diseño que combina diferentes elementos visuales de la cultura contemporánea asiática.",
  price: 359,
  stock: 21,
  image: "tshirt-105.jpg",
  category: "cultura-asiatica",
  tags: ["asia", "culture", "fusion", "streetwear"],
},
// =========================================================
// VIDEOJUEGOS — JRPG
// =========================================================

{
  name: "JRPG Fantasy Adventure Tee",
  description: "Diseño inspirado en los mundos fantásticos y aventuras características de los JRPG.",
  price: 359,
  stock: 22,
  image: "tshirt-106.jpg",
  category: "jrpg",
  tags: ["videojuegos", "jrpg", "rpg", "fantasy"],
},

{
  name: "JRPG Crystal Warrior Tee",
  description: "Camiseta inspirada en guerreros, cristales y mundos de fantasía de los RPG japoneses.",
  price: 369,
  stock: 20,
  image: "tshirt-107.jpg",
  category: "jrpg",
  tags: ["videojuegos", "jrpg", "crystal", "warrior"],
},

{
  name: "JRPG Party Heroes Tee",
  description: "Diseño inspirado en los grupos de héroes y compañeros clásicos de los JRPG.",
  price: 359,
  stock: 18,
  image: "tshirt-108.jpg",
  category: "jrpg",
  tags: ["videojuegos", "jrpg", "heroes", "party"],
},

{
  name: "JRPG Final Battle Tee",
  description: "Camiseta inspirada en las épicas batallas finales de los videojuegos japoneses de rol.",
  price: 379,
  stock: 17,
  image: "tshirt-109.jpg",
  category: "jrpg",
  tags: ["videojuegos", "jrpg", "battle", "fantasy"],
},

{
  name: "JRPG Pixel Fantasy Tee",
  description: "Diseño que combina elementos de fantasía japonesa con una estética inspirada en los RPG clásicos.",
  price: 349,
  stock: 24,
  image: "tshirt-110.jpg",
  category: "jrpg",
  tags: ["videojuegos", "jrpg", "pixel", "retro"],
},


// =========================================================
// VIDEOJUEGOS — NINTENDO
// =========================================================

{
  name: "Mushroom Kingdom Adventure Tee",
  description: "Diseño inspirado en los mundos coloridos y aventuras clásicas de Nintendo.",
  price: 359,
  stock: 25,
  image: "tshirt-111.jpg",
  category: "nintendo",
  tags: ["videojuegos", "nintendo", "mushroom-kingdom", "gaming"],
},

{
  name: "Nintendo Retro Controller Tee",
  description: "Camiseta inspirada en los controles clásicos y la historia de los videojuegos de Nintendo.",
  price: 349,
  stock: 22,
  image: "tshirt-112.jpg",
  category: "nintendo",
  tags: ["videojuegos", "nintendo", "controller", "retro"],
},

{
  name: "Hyrule Adventure Tee",
  description: "Diseño inspirado en las aventuras, paisajes y exploración de los mundos de fantasía de Nintendo.",
  price: 369,
  stock: 20,
  image: "tshirt-113.jpg",
  category: "nintendo",
  tags: ["videojuegos", "nintendo", "hyrule", "adventure"],
},

{
  name: "Nintendo Pixel Heroes Tee",
  description: "Camiseta inspirada en personajes y gráficos pixelados de la era clásica de Nintendo.",
  price: 349,
  stock: 24,
  image: "tshirt-114.jpg",
  category: "nintendo",
  tags: ["videojuegos", "nintendo", "pixel", "retro"],
},

{
  name: "Nintendo Power Up Tee",
  description: "Diseño inspirado en los elementos y potenciadores clásicos de los videojuegos de Nintendo.",
  price: 339,
  stock: 26,
  image: "tshirt-115.jpg",
  category: "nintendo",
  tags: ["videojuegos", "nintendo", "power-up", "gaming"],
},


// =========================================================
// VIDEOJUEGOS — PLAYSTATION
// =========================================================

{
  name: "PlayStation Retro Console Tee",
  description: "Camiseta inspirada en la estética de las primeras generaciones de PlayStation.",
  price: 359,
  stock: 22,
  image: "tshirt-116.jpg",
  category: "playstation",
  tags: ["videojuegos", "playstation", "retro", "console"],
},

{
  name: "PlayStation Controller Tee",
  description: "Diseño minimalista inspirado en el clásico control de PlayStation.",
  price: 339,
  stock: 25,
  image: "tshirt-117.jpg",
  category: "playstation",
  tags: ["videojuegos", "playstation", "controller", "gaming"],
},

{
  name: "PlayStation Gaming Evolution Tee",
  description: "Diseño inspirado en la evolución de las consolas y videojuegos de PlayStation.",
  price: 359,
  stock: 20,
  image: "tshirt-118.jpg",
  category: "playstation",
  tags: ["videojuegos", "playstation", "gaming", "console"],
},

{
  name: "PlayStation Neon Gamer Tee",
  description: "Camiseta inspirada en una estética urbana y futurista basada en el gaming.",
  price: 369,
  stock: 19,
  image: "tshirt-119.jpg",
  category: "playstation",
  tags: ["videojuegos", "playstation", "neon", "gamer"],
},

{
  name: "PlayStation Pixel Memories Tee",
  description: "Diseño inspirado en los recuerdos y videojuegos clásicos de la era PlayStation.",
  price: 349,
  stock: 21,
  image: "tshirt-120.jpg",
  category: "playstation",
  tags: ["videojuegos", "playstation", "pixel", "retro"],
},


// =========================================================
// VIDEOJUEGOS — RETRO
// =========================================================

{
  name: "8-Bit Arcade Tee",
  description: "Camiseta inspirada en los gráficos pixelados y las máquinas arcade clásicas.",
  price: 329,
  stock: 28,
  image: "tshirt-121.jpg",
  category: "retro",
  tags: ["videojuegos", "retro", "arcade", "8-bit"],
},

{
  name: "16-Bit Adventure Tee",
  description: "Diseño inspirado en la época dorada de los videojuegos de 16 bits.",
  price: 339,
  stock: 25,
  image: "tshirt-122.jpg",
  category: "retro",
  tags: ["videojuegos", "retro", "16-bit", "gaming"],
},

{
  name: "Retro Arcade Insert Coin Tee",
  description: "Diseño inspirado en las clásicas máquinas arcade y la cultura gamer de los años 80 y 90.",
  price: 329,
  stock: 27,
  image: "tshirt-123.jpg",
  category: "retro",
  tags: ["videojuegos", "retro", "arcade", "insert-coin"],
},

{
  name: "Pixel Boss Battle Tee",
  description: "Camiseta inspirada en los enfrentamientos contra jefes de los videojuegos clásicos.",
  price: 339,
  stock: 22,
  image: "tshirt-124.jpg",
  category: "retro",
  tags: ["videojuegos", "retro", "pixel", "boss"],
},

{
  name: "Retro Gamer Collection Tee",
  description: "Diseño inspirado en diferentes elementos de la cultura de los videojuegos retro.",
  price: 349,
  stock: 24,
  image: "tshirt-125.jpg",
  category: "retro",
  tags: ["videojuegos", "retro", "gamer", "arcade"],
},


// =========================================================
// VIDEOJUEGOS — GAMING
// =========================================================

{
  name: "Level Up Gaming Tee",
  description: "Camiseta para gamers inspirada en la clásica progresión de niveles de los videojuegos.",
  price: 329,
  stock: 30,
  image: "tshirt-126.jpg",
  category: "gaming",
  tags: ["gaming", "gamer", "level-up", "videojuegos"],
},

{
  name: "Game Over Pixel Tee",
  description: "Diseño inspirado en la pantalla clásica de Game Over y la estética arcade.",
  price: 329,
  stock: 28,
  image: "tshirt-127.jpg",
  category: "gaming",
  tags: ["gaming", "game-over", "pixel", "arcade"],
},

{
  name: "Gamer Setup Tee",
  description: "Diseño inspirado en estaciones de juego, controles y cultura gamer.",
  price: 339,
  stock: 25,
  image: "tshirt-128.jpg",
  category: "gaming",
  tags: ["gaming", "setup", "gamer", "controller"],
},

{
  name: "Boss Fight Gaming Tee",
  description: "Camiseta inspirada en la emoción de enfrentarse a un jefe final.",
  price: 349,
  stock: 23,
  image: "tshirt-129.jpg",
  category: "gaming",
  tags: ["gaming", "boss", "battle", "gamer"],
},

{
  name: "Gaming Universe Tee",
  description: "Diseño inspirado en la cultura gamer y los diferentes géneros de videojuegos.",
  price: 339,
  stock: 26,
  image: "tshirt-130.jpg",
  category: "gaming",
  tags: ["gaming", "gamer", "video-games", "culture"],
},


// =========================================================
// CULTURA POP — MARVEL
// =========================================================

{
  name: "Avengers Assemble Tee",
  description: "Camiseta inspirada en los héroes y la estética de los Avengers.",
  price: 389,
  stock: 22,
  image: "tshirt-131.jpg",
  category: "marvel",
  tags: ["marvel", "avengers", "superheroes", "comics"],
},

{
  name: "Spider Hero City Tee",
  description: "Diseño inspirado en un héroe arácnido recorriendo los rascacielos de una gran ciudad.",
  price: 379,
  stock: 24,
  image: "tshirt-132.jpg",
  category: "marvel",
  tags: ["marvel", "spider", "hero", "city"],
},

{
  name: "Marvel Cosmic Heroes Tee",
  description: "Camiseta inspirada en los héroes y aventuras cósmicas del universo Marvel.",
  price: 389,
  stock: 19,
  image: "tshirt-133.jpg",
  category: "marvel",
  tags: ["marvel", "cosmic", "heroes", "comics"],
},

{
  name: "Marvel Comic Panel Tee",
  description: "Diseño inspirado en las clásicas viñetas de cómics de superhéroes.",
  price: 379,
  stock: 21,
  image: "tshirt-134.jpg",
  category: "marvel",
  tags: ["marvel", "comics", "panel", "superheroes"],
},

{
  name: "Marvel Hero Symbols Tee",
  description: "Diseño inspirado en símbolos y elementos visuales asociados con héroes de Marvel.",
  price: 369,
  stock: 25,
  image: "tshirt-135.jpg",
  category: "marvel",
  tags: ["marvel", "heroes", "symbols", "comics"],
},


// =========================================================
// CULTURA POP — DC
// =========================================================

{
  name: "Gotham Knight Tee",
  description: "Camiseta inspirada en la estética oscura del héroe de Gotham.",
  price: 389,
  stock: 21,
  image: "tshirt-136.jpg",
  category: "dc",
  tags: ["dc", "batman", "gotham", "comics"],
},

{
  name: "Man of Steel Tee",
  description: "Diseño inspirado en el símbolo y la estética del héroe de Metropolis.",
  price: 389,
  stock: 20,
  image: "tshirt-137.jpg",
  category: "dc",
  tags: ["dc", "superman", "hero", "comics"],
},

{
  name: "Gotham City Night Tee",
  description: "Diseño urbano inspirado en la ciudad de Gotham durante la noche.",
  price: 379,
  stock: 18,
  image: "tshirt-138.jpg",
  category: "dc",
  tags: ["dc", "gotham", "batman", "city"],
},

{
  name: "DC Heroes Comic Tee",
  description: "Camiseta inspirada en la estética clásica de los héroes de DC Comics.",
  price: 379,
  stock: 22,
  image: "tshirt-139.jpg",
  category: "dc",
  tags: ["dc", "heroes", "comics", "superheroes"],
},

{
  name: "Dark Hero Symbol Tee",
  description: "Diseño minimalista inspirado en la simbología de los héroes oscuros de DC.",
  price: 369,
  stock: 25,
  image: "tshirt-140.jpg",
  category: "dc",
  tags: ["dc", "dark", "hero", "symbol"],
},


// =========================================================
// CULTURA POP — PELÍCULAS
// =========================================================

{
  name: "Classic Cinema Reel Tee",
  description: "Diseño inspirado en las películas clásicas y la historia del cine.",
  price: 349,
  stock: 24,
  image: "tshirt-141.jpg",
  category: "pop-peliculas",
  tags: ["movies", "cinema", "classic", "film"],
},

{
  name: "Sci-Fi Movie Universe Tee",
  description: "Camiseta inspirada en la estética de las grandes películas de ciencia ficción.",
  price: 359,
  stock: 20,
  image: "tshirt-142.jpg",
  category: "pop-peliculas",
  tags: ["movies", "sci-fi", "cinema", "space"],
},

{
  name: "Horror Movie Night Tee",
  description: "Diseño inspirado en la estética de las películas clásicas de terror.",
  price: 359,
  stock: 18,
  image: "tshirt-143.jpg",
  category: "pop-peliculas",
  tags: ["movies", "horror", "cinema", "classic"],
},

{
  name: "Action Movie Poster Tee",
  description: "Camiseta inspirada en la estética de los carteles clásicos del cine de acción.",
  price: 349,
  stock: 22,
  image: "tshirt-144.jpg",
  category: "pop-peliculas",
  tags: ["movies", "action", "poster", "cinema"],
},

{
  name: "Movie Night Popcorn Tee",
  description: "Diseño inspirado en la experiencia clásica de una noche de películas.",
  price: 329,
  stock: 27,
  image: "tshirt-145.jpg",
  category: "pop-peliculas",
  tags: ["movies", "cinema", "popcorn", "film"],
},


// =========================================================
// CULTURA POP — SERIES
// =========================================================

{
  name: "Retro TV Series Tee",
  description: "Diseño inspirado en la estética de las series clásicas de televisión.",
  price: 339,
  stock: 24,
  image: "tshirt-146.jpg",
  category: "pop-series",
  tags: ["series", "tv", "retro", "culture"],
},

{
  name: "Streaming Night Tee",
  description: "Camiseta inspirada en la cultura moderna de las series y plataformas de streaming.",
  price: 329,
  stock: 28,
  image: "tshirt-147.jpg",
  category: "pop-series",
  tags: ["series", "streaming", "tv", "culture"],
},

{
  name: "Mystery Series Tee",
  description: "Diseño inspirado en las series de misterio, investigación y suspenso.",
  price: 349,
  stock: 21,
  image: "tshirt-148.jpg",
  category: "pop-series",
  tags: ["series", "mystery", "thriller", "tv"],
},

{
  name: "Sci-Fi Series Universe Tee",
  description: "Camiseta inspirada en los universos futuristas y de ciencia ficción de la televisión.",
  price: 359,
  stock: 20,
  image: "tshirt-149.jpg",
  category: "pop-series",
  tags: ["series", "sci-fi", "future", "tv"],
},

{
  name: "Series Binge Watcher Tee",
  description: "Diseño para amantes de las maratones de series y la cultura televisiva.",
  price: 329,
  stock: 26,
  image: "tshirt-150.jpg",
  category: "pop-series",
  tags: ["series", "tv", "binge", "streaming"],
},


// =========================================================
// CULTURA POP — CÓMICS
// =========================================================

{
  name: "Comic Book Panels Tee",
  description: "Camiseta inspirada en la composición clásica de las páginas de cómic.",
  price: 349,
  stock: 24,
  image: "tshirt-151.jpg",
  category: "comics",
  tags: ["comics", "comic-book", "panels", "pop-culture"],
},

{
  name: "Vintage Comic Print Tee",
  description: "Diseño inspirado en la estética vintage de los cómics clásicos.",
  price: 359,
  stock: 20,
  image: "tshirt-152.jpg",
  category: "comics",
  tags: ["comics", "vintage", "retro", "comic-book"],
},

{
  name: "Comic Onomatopoeia Tee",
  description: "Diseño inspirado en las expresiones visuales y onomatopeyas tradicionales de los cómics.",
  price: 339,
  stock: 25,
  image: "tshirt-153.jpg",
  category: "comics",
  tags: ["comics", "onomatopoeia", "pop-art", "retro"],
},

{
  name: "Superhero Comic Ink Tee",
  description: "Camiseta inspirada en las ilustraciones de tinta de los cómics de superhéroes.",
  price: 359,
  stock: 21,
  image: "tshirt-154.jpg",
  category: "comics",
  tags: ["comics", "superheroes", "ink", "illustration"],
},

{
  name: "Comic Collector Tee",
  description: "Diseño inspirado en la cultura de coleccionar cómics y novelas gráficas.",
  price: 339,
  stock: 23,
  image: "tshirt-155.jpg",
  category: "comics",
  tags: ["comics", "collector", "graphic-novel", "geek"],
},


// =========================================================
// CULTURA POP — ANIMACIÓN
// =========================================================

{
  name: "Classic Cartoon Studio Tee",
  description: "Diseño inspirado en la historia y estética de la animación clásica.",
  price: 349,
  stock: 23,
  image: "tshirt-156.jpg",
  category: "animacion",
  tags: ["animation", "cartoon", "classic", "pop-culture"],
},

{
  name: "Saturday Morning Cartoons Tee",
  description: "Camiseta inspirada en la nostalgia de las caricaturas de los sábados por la mañana.",
  price: 339,
  stock: 27,
  image: "tshirt-157.jpg",
  category: "animacion",
  tags: ["animation", "cartoon", "retro", "nostalgia"],
},

{
  name: "Animated Fantasy World Tee",
  description: "Diseño inspirado en mundos fantásticos creados mediante animación.",
  price: 359,
  stock: 20,
  image: "tshirt-158.jpg",
  category: "animacion",
  tags: ["animation", "fantasy", "cartoon", "adventure"],
},

{
  name: "Animation Character Sketch Tee",
  description: "Camiseta inspirada en bocetos y hojas de diseño de personajes animados.",
  price: 349,
  stock: 22,
  image: "tshirt-159.jpg",
  category: "animacion",
  tags: ["animation", "character", "sketch", "art"],
},

{
  name: "Animated Pop Culture Tee",
  description: "Diseño inspirado en la cultura popular de la animación y sus personajes memorables.",
  price: 349,
  stock: 24,
  image: "tshirt-160.jpg",
  category: "animacion",
  tags: ["animation", "cartoon", "pop-culture", "characters"],
},

// =========================================================
// ORIGINALES — DISEÑOS EXCLUSIVOS
// =========================================================

{
  name: "Otaku Spirit Exclusive Tee",
  description: "Diseño exclusivo inspirado en la pasión por el anime, manga y cultura japonesa.",
  price: 379,
  stock: 20,
  image: "tshirt-161.jpg",
  category: "disenos-exclusivos",
  tags: ["original", "exclusive", "otaku", "anime"],
},

{
  name: "Japanese Midnight Exclusive Tee",
  description: "Diseño exclusivo con una estética nocturna inspirada en las calles de Japón.",
  price: 389,
  stock: 18,
  image: "tshirt-162.jpg",
  category: "disenos-exclusivos",
  tags: ["original", "exclusive", "japan", "streetwear"],
},

{
  name: "Anime Ink Exclusive Tee",
  description: "Diseño exclusivo inspirado en ilustraciones de tinta y estética manga.",
  price: 369,
  stock: 22,
  image: "tshirt-163.jpg",
  category: "disenos-exclusivos",
  tags: ["original", "exclusive", "anime", "manga", "ink"],
},

{
  name: "Neo Tokyo Exclusive Tee",
  description: "Diseño exclusivo inspirado en una visión futurista y urbana de Tokio.",
  price: 389,
  stock: 17,
  image: "tshirt-164.jpg",
  category: "disenos-exclusivos",
  tags: ["original", "exclusive", "tokyo", "cyberpunk"],
},

{
  name: "Otaku Street Exclusive Tee",
  description: "Camiseta exclusiva que combina cultura otaku con una estética moderna de streetwear.",
  price: 379,
  stock: 21,
  image: "tshirt-165.jpg",
  category: "disenos-exclusivos",
  tags: ["original", "exclusive", "otaku", "streetwear"],
},


// =========================================================
// ORIGINALES — ARTE ORIGINAL
// =========================================================

{
  name: "Moonlit Kitsune Art Tee",
  description: "Ilustración original de un kitsune bajo la luz de la luna.",
  price: 389,
  stock: 19,
  image: "tshirt-166.jpg",
  category: "arte-original",
  tags: ["original-art", "kitsune", "japan", "illustration"],
},

{
  name: "Samurai Ink Illustration Tee",
  description: "Ilustración original inspirada en la silueta y estética de un samurái.",
  price: 399,
  stock: 18,
  image: "tshirt-167.jpg",
  category: "arte-original",
  tags: ["original-art", "samurai", "ink", "illustration"],
},

{
  name: "Dragon Spirit Original Art Tee",
  description: "Diseño artístico original inspirado en la figura mitológica del dragón asiático.",
  price: 399,
  stock: 17,
  image: "tshirt-168.jpg",
  category: "arte-original",
  tags: ["original-art", "dragon", "asia", "illustration"],
},

{
  name: "Cyber Oni Original Art Tee",
  description: "Ilustración original que combina una máscara oni tradicional con estética futurista.",
  price: 389,
  stock: 20,
  image: "tshirt-169.jpg",
  category: "arte-original",
  tags: ["original-art", "oni", "cyberpunk", "japan"],
},

{
  name: "Sakura Warrior Original Art Tee",
  description: "Diseño artístico original que combina flores de sakura con la figura de un guerrero.",
  price: 399,
  stock: 16,
  image: "tshirt-170.jpg",
  category: "arte-original",
  tags: ["original-art", "sakura", "warrior", "japan"],
},


// =========================================================
// ORIGINALES — COLECCIONES PROPIAS
// =========================================================

{
  name: "Neo Japan Collection Tee",
  description: "Diseño perteneciente a nuestra colección propia inspirada en el Japón futurista.",
  price: 389,
  stock: 20,
  image: "tshirt-171.jpg",
  category: "colecciones-propias",
  tags: ["original", "collection", "japan", "future"],
},

{
  name: "Yokai Legends Collection Tee",
  description: "Diseño de colección inspirado en las leyendas y criaturas del folclore japonés.",
  price: 399,
  stock: 18,
  image: "tshirt-172.jpg",
  category: "colecciones-propias",
  tags: ["original", "collection", "yokai", "japan"],
},

{
  name: "Otaku Heritage Collection Tee",
  description: "Parte de una colección propia que combina anime, manga y elementos tradicionales japoneses.",
  price: 379,
  stock: 22,
  image: "tshirt-173.jpg",
  category: "colecciones-propias",
  tags: ["original", "collection", "otaku", "manga"],
},

{
  name: "Asian Future Collection Tee",
  description: "Diseño perteneciente a una colección propia inspirada en la cultura urbana asiática.",
  price: 389,
  stock: 19,
  image: "tshirt-174.jpg",
  category: "colecciones-propias",
  tags: ["original", "collection", "asia", "future"],
},

{
  name: "Anime Street Collection Tee",
  description: "Diseño exclusivo de nuestra colección propia de anime y streetwear.",
  price: 379,
  stock: 21,
  image: "tshirt-175.jpg",
  category: "colecciones-propias",
  tags: ["original", "collection", "anime", "streetwear"],
},

// =========================================================
// COLECCIONES — NUEVOS
// =========================================================

{
  name: "New Arrival Anime Tee",
  description: "Uno de nuestros diseños más recientes inspirado en la cultura anime.",
  price: 369,
  stock: 20,
  image: "tshirt-176.jpg",
  category: "nuevos",
  tags: ["new", "anime", "new-arrival"],
},

{
  name: "New Arrival Japan Tee",
  description: "Nuevo diseño inspirado en la estética y cultura japonesa.",
  price: 359,
  stock: 22,
  image: "tshirt-177.jpg",
  category: "nuevos",
  tags: ["new", "japan", "new-arrival"],
},

{
  name: "New Arrival Gaming Tee",
  description: "Nuevo diseño inspirado en videojuegos y cultura gamer.",
  price: 349,
  stock: 24,
  image: "tshirt-178.jpg",
  category: "nuevos",
  tags: ["new", "gaming", "video-games"],
},

{
  name: "New Arrival K-Culture Tee",
  description: "Nuevo diseño inspirado en la cultura coreana y el estilo urbano de Seúl.",
  price: 359,
  stock: 21,
  image: "tshirt-179.jpg",
  category: "nuevos",
  tags: ["new", "korea", "k-culture"],
},

{
  name: "New Arrival Streetwear Tee",
  description: "Nuevo diseño que combina estética otaku con moda urbana contemporánea.",
  price: 369,
  stock: 20,
  image: "tshirt-180.jpg",
  category: "nuevos",
  tags: ["new", "streetwear", "otaku"],
},


// =========================================================
// COLECCIONES — MÁS VENDIDOS
// =========================================================

{
  name: "Best Seller Anime Tee",
  description: "Uno de los diseños favoritos de nuestra colección de anime.",
  price: 359,
  stock: 30,
  image: "tshirt-181.jpg",
  category: "mas-vendidos",
  tags: ["best-seller", "anime", "popular"],
},

{
  name: "Best Seller Samurai Tee",
  description: "Diseño inspirado en samuráis que se encuentra entre los favoritos de nuestros clientes.",
  price: 379,
  stock: 28,
  image: "tshirt-182.jpg",
  category: "mas-vendidos",
  tags: ["best-seller", "samurai", "japan"],
},

{
  name: "Best Seller Yokai Tee",
  description: "Diseño inspirado en criaturas del folclore japonés y uno de los favoritos de la colección.",
  price: 369,
  stock: 27,
  image: "tshirt-183.jpg",
  category: "mas-vendidos",
  tags: ["best-seller", "yokai", "japan"],
},

{
  name: "Best Seller Gaming Tee",
  description: "Diseño gamer inspirado en la nostalgia y cultura de los videojuegos.",
  price: 349,
  stock: 32,
  image: "tshirt-184.jpg",
  category: "mas-vendidos",
  tags: ["best-seller", "gaming", "retro"],
},

{
  name: "Best Seller Tokyo Tee",
  description: "Uno de los diseños favoritos inspirado en las calles y luces de Tokio.",
  price: 379,
  stock: 26,
  image: "tshirt-185.jpg",
  category: "mas-vendidos",
  tags: ["best-seller", "tokyo", "japan"],
},


// =========================================================
// COLECCIONES — EDICIONES LIMITADAS
// =========================================================

{
  name: "Limited Sakura Edition Tee",
  description: "Edición limitada inspirada en los cerezos en flor de Japón.",
  price: 429,
  stock: 10,
  image: "tshirt-186.jpg",
  category: "ediciones-limitadas",
  tags: ["limited", "sakura", "japan", "exclusive"],
},

{
  name: "Limited Samurai Edition Tee",
  description: "Edición limitada inspirada en la estética de los guerreros samurái.",
  price: 439,
  stock: 8,
  image: "tshirt-187.jpg",
  category: "ediciones-limitadas",
  tags: ["limited", "samurai", "japan", "exclusive"],
},

{
  name: "Limited Yokai Edition Tee",
  description: "Edición especial y limitada inspirada en el folclore sobrenatural japonés.",
  price: 429,
  stock: 9,
  image: "tshirt-188.jpg",
  category: "ediciones-limitadas",
  tags: ["limited", "yokai", "japan", "exclusive"],
},

{
  name: "Limited Neo Tokyo Edition Tee",
  description: "Edición limitada inspirada en una visión futurista de Tokio.",
  price: 449,
  stock: 7,
  image: "tshirt-189.jpg",
  category: "ediciones-limitadas",
  tags: ["limited", "tokyo", "cyberpunk", "exclusive"],
},

{
  name: "Limited Otaku Edition Tee",
  description: "Diseño especial de edición limitada para coleccionistas y fans de la cultura otaku.",
  price: 439,
  stock: 8,
  image: "tshirt-190.jpg",
  category: "ediciones-limitadas",
  tags: ["limited", "otaku", "anime", "exclusive"],
},


// =========================================================
// COLECCIONES — TEMPORADAS
// =========================================================

{
  name: "Spring Sakura Season Tee",
  description: "Diseño inspirado en la primavera japonesa y la temporada de sakura.",
  price: 359,
  stock: 22,
  image: "tshirt-191.jpg",
  category: "temporadas",
  tags: ["seasonal", "spring", "sakura", "japan"],
},

{
  name: "Summer Matsuri Season Tee",
  description: "Camiseta inspirada en los festivales y celebraciones tradicionales del verano japonés.",
  price: 359,
  stock: 20,
  image: "tshirt-192.jpg",
  category: "temporadas",
  tags: ["seasonal", "summer", "matsuri", "japan"],
},

{
  name: "Autumn Maple Japan Tee",
  description: "Diseño inspirado en los colores del otoño y los paisajes japoneses.",
  price: 349,
  stock: 21,
  image: "tshirt-193.jpg",
  category: "temporadas",
  tags: ["seasonal", "autumn", "maple", "japan"],
},

{
  name: "Winter Japanese Night Tee",
  description: "Camiseta inspirada en los paisajes nocturnos y el ambiente invernal de Japón.",
  price: 369,
  stock: 18,
  image: "tshirt-194.jpg",
  category: "temporadas",
  tags: ["seasonal", "winter", "japan", "night"],
},

{
  name: "Holiday Otaku Season Tee",
  description: "Diseño especial de temporada que combina estética otaku con elementos festivos.",
  price: 359,
  stock: 23,
  image: "tshirt-195.jpg",
  category: "temporadas",
  tags: ["seasonal", "holiday", "otaku", "anime"],
},

];

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

// Upsert por slug (único en el schema): re-ejecutar el seed no duplica productos ni pisa
// cambios reales (stock vendido, is_active, etc.) de un producto que ya existe.
const upsertProduct = async (p) => {
  const slug = slugify(p.name);
  return Product.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageURL: img(p.image),
        images: [img(p.image)],
        slug,
        sizes: ["S", "M", "L", "XL"],
        tags: p.tags,
        category: cat(p.category),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const createdProducts = await Promise.all(productsData.map(upsertProduct));

console.log(`${createdProducts.length} products ready (creados o ya existentes, sin duplicar)`);

    // ADDRESSES — Address no tiene índice único en el schema; la idempotencia se logra
    // creando solo para los usuarios que todavía no tienen ninguna dirección.
    const usersNeedingAddress = [];
    for (let i = 0; i < users.length; i++) {
      const hasAddress = await Address.exists({ user: users[i]._id });
      if (!hasAddress) usersNeedingAddress.push(i);
    }
    if (usersNeedingAddress.length) {
      await Address.insertMany(
        usersNeedingAddress.map((i) => ({
          user: users[i]._id,
          address: `Street ${i + 1} #123`,
          city: "Aguascalientes",
          state: "Aguascalientes",
          postalCode: "20000",
          country: "Mexico",
          phone: `44912345${String(i).padStart(2, "0")}`,
          isDefault: i === 0,
          addressType: i % 2 === 0 ? "home" : "work",
        }))
      );
    }
    console.log(
      `Addresses ready (${usersNeedingAddress.length} creadas, ${
        users.length - usersNeedingAddress.length
      } ya existían)`
    );

    // PAYMENT METHODS — misma estrategia: solo se crea si el usuario aún no tiene ninguno.
    const usersNeedingPayment = [];
    for (let i = 0; i < users.length; i++) {
      const hasPayment = await PaymentMethod.exists({ user: users[i]._id });
      if (!hasPayment) usersNeedingPayment.push(i);
    }
    if (usersNeedingPayment.length) {
      await PaymentMethod.insertMany(
        usersNeedingPayment.map((i) => ({
          user: users[i]._id,
          type: i % 2 === 0 ? "credit_card" : "paypal",
          last4: i % 2 === 0 ? "1111" : undefined,
          brand: i % 2 === 0 ? "visa" : undefined,
          cardHolderName: i % 2 === 0 ? `User ${i + 1}` : undefined,
          expiryDate: i % 2 === 0 ? "12/30" : undefined,
          paypalEmail: i % 2 !== 0 ? `user${i + 1}@paypal.com` : undefined,
          isDefault: i === 0,
          isActive: true,
        }))
      );
    }
    console.log(
      `Payment methods ready (${usersNeedingPayment.length} creados, ${
        users.length - usersNeedingPayment.length
      } ya existían)`
    );

    await mongoose.disconnect();
    console.log("Seed finalizado. Conexión cerrada.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seed();
