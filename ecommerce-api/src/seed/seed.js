import bcrypt from "bcrypt";
import dotenv from "dotenv";
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

const seed = async () => {
  try {
    await connectDB();

    // LIMPIAR DB
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Address.deleteMany();
    await PaymentMethod.deleteMany();
    await Cart.deleteMany();
    await Order.deleteMany();

    console.log("DB cleaned");

    // CATEGORÍAS RAÍZ
    const [anime, occidental] = await Category.insertMany([
      { name: "Anime", description: "Camisetas de anime", type: "anime", slug: "anime" },
      { name: "Occidental", description: "Camisetas de cultura occidental", type: "occidental", slug: "occidental" },
    ]);

    // SUBCATEGORÍAS
    const subCategories = await Category.insertMany([
      { name: "Naruto", description: "Naruto", type: "anime", slug: "naruto", parentCategory: anime._id },
      { name: "Dragon Ball", description: "Dragon Ball", type: "anime", slug: "dragon-ball", parentCategory: anime._id },
      { name: "One Piece", description: "One Piece", type: "anime", slug: "one-piece", parentCategory: anime._id },
      { name: "Attack on Titan", description: "Attack on Titan", type: "anime", slug: "attack-on-titan", parentCategory: anime._id },
      { name: "Marvel", description: "Marvel", type: "occidental", slug: "marvel", parentCategory: occidental._id },
      { name: "DC", description: "DC Comics", type: "occidental", slug: "dc", parentCategory: occidental._id },
      { name: "Star Wars", description: "Star Wars", type: "occidental", slug: "star-wars", parentCategory: occidental._id },
      { name: "Gaming", description: "Gaming", type: "occidental", slug: "gaming", parentCategory: occidental._id },
      { name: "Streetwear", description: "Streetwear", type: "occidental", slug: "streetwear", parentCategory: occidental._id },
    ]);

    const cat = (slug) =>
      slug === "anime"
        ? anime._id
        : slug === "occidental"
          ? occidental._id
          : subCategories.find((c) => c.slug === slug)._id;

    console.log("Categories created");

    // USERS (password hasheado para que el login funcione)
    const passwordHash = await bcrypt.hash("123456", 10);
    const users = await User.insertMany(
      Array.from({ length: 10 }).map((_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        password: passwordHash, // demo: todos usan "123456"
        role: i === 0 ? "admin" : "customer",
      }))
    );

    console.log("Users created (login demo: user1@test.com / 123456, admin)");

    // PRODUCTS (slug explícito: insertMany no dispara el hook pre-save)
    const productsData = [
      { name: "Naruto Sage Mode Tee", description: "Camiseta de algodón con estampado de Modo Sabio.", price: 349, stock: 20, image: "tshirt-01.jpg", category: "naruto" },
      { name: "Dragon Ball Super Saiyan Tee", description: "Camiseta con aura Super Saiyan de alta calidad.", price: 359, stock: 18, image: "tshirt-02.jpg", category: "dragon-ball" },
      { name: "One Piece Straw Hat Tee", description: "Camiseta de la tripulación del Sombrero de Paja.", price: 349, stock: 25, image: "tshirt-03.jpg", category: "one-piece" },
      { name: "Attack on Titan Scouts Tee", description: "Camiseta del Cuerpo de Exploración.", price: 379, stock: 15, image: "tshirt-04.jpg", category: "attack-on-titan" },
      { name: "Anime Classic Logo Tee", description: "Diseño minimalista para todo fan del anime.", price: 299, stock: 30, image: "tshirt-05.jpg", category: "anime" },
      { name: "Marvel Avengers Tee", description: "Camiseta oficial estilo Vengadores.", price: 389, stock: 22, image: "tshirt-06.jpg", category: "marvel" },
      { name: "DC Dark Knight Tee", description: "Camiseta del Caballero Oscuro.", price: 389, stock: 17, image: "tshirt-07.jpg", category: "dc" },
      { name: "Star Wars Galaxy Tee", description: "Camiseta de una galaxia muy, muy lejana.", price: 369, stock: 21, image: "tshirt-08.jpg", category: "star-wars" },
      { name: "Retro Gaming Pixel Tee", description: "Camiseta pixel-art para gamers retro.", price: 329, stock: 28, image: "tshirt-09.jpg", category: "gaming" },
      { name: "Streetwear Oversize Tee", description: "Camiseta oversize de estilo urbano.", price: 399, stock: 24, image: "tshirt-10.jpg", category: "streetwear" },
    ];

    const slugify = (text) =>
      text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

    await Product.insertMany(
      productsData.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageURL: img(p.image),
        images: [img(p.image)],
        slug: slugify(p.name),
        sizes: ["S", "M", "L", "XL"],
        tags: [p.category],
        category: cat(p.category),
      }))
    );

    console.log("Products created");

    // ADDRESSES
    await Address.insertMany(
      users.map((user, i) => ({
        user: user._id,
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

    console.log("Addresses created");

    // PAYMENT METHODS
    await PaymentMethod.insertMany(
      users.map((user, i) => ({
        user: user._id,
        type: i % 2 === 0 ? "credit_card" : "paypal",
        cardNumber: i % 2 === 0 ? "4111111111111111" : undefined,
        cardHolderName: i % 2 === 0 ? `User ${i + 1}` : undefined,
        expiryDate: i % 2 === 0 ? "12/30" : undefined,
        paypalEmail: i % 2 !== 0 ? `user${i + 1}@paypal.com` : undefined,
        isDefault: i === 0,
        isActive: true,
      }))
    );

    console.log("Payment methods created");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
