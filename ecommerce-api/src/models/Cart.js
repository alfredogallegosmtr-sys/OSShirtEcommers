import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    // Relación con el usuario (1 carrito por usuario)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 🔥 Un usuario solo puede tener un carrito
    },

    // Productos dentro del carrito
    products: [
      {
        // Referencia al producto
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // Cantidad de ese producto
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // Marca de tiempo (Date.now() del cliente, no del servidor) del último cambio de
        // cantidad aceptado -- permite descartar un PATCH que llega desordenado por la red
        // (ver updateQuantity en cart.controller.js).
        lastClientTimestamp: {
          type: Number,
        },
      },
    ],

// Despues agregar mas caracteristicas al carrito

    // Total del carrito
    total: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Crear modelo
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;