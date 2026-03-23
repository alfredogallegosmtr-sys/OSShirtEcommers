import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Nombre del producto
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Descripción del producto
    description: {
      type: String,
    },

    // Precio (equivalente a double en SQL)
    price: {
      type: Number,
      required: true,
    },

    // Stock disponible
    stock: {
      type: Number,
      default: 0,
    },

    // Imagen principal (del código base)
    imageURL: {
      type: String,
      default: "https://placehold.co/600x400",
    },

    // Imágenes adicionales (array en lugar de JSON string)
    images: [
      {
        type: String,
      },
    ],

    
    // Slug único para URLs amigables
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Tallas (mejor como array en lugar de CSV)
    sizes: [
      {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL"],
      },
    ],

    // Tags (array de strings)
    tags: [
      {
        type: String,
      },
    ],

    average_rating: {
      type: Number,
      default: 0,
    },

    review_count: {
      type: Number,
      default: 0,
    },

    // Estado del producto
    is_active: {
      type: Boolean,
      default: true,
    },

    // Modificar el producto UPDATE    
    is_deleted: {
      type: Boolean,
      default: true,
    },    



    // Relación con categoría (FK → categories)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true },
);

// Crear modelo
const Product = mongoose.model("Product", productSchema);

export default Product;