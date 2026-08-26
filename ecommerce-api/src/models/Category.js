import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Tipo (equivalente a ENUM en SQL)
    type: {
      type: String,
      required: true,
      enum: ["anime", "occidental"],
    },

    // Slug único (para URLs amigables)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    imageURL: {
      type: String,
      default: "https://placehold.co/800x600.png",
    },

    // Relación opcional (jerarquía de categorías, crear subcategorias)
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
        },
    },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;