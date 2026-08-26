import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

export const getAllCategories = async (req, res) => {
  const categories = await Category.find().populate("parentCategory");
  res.json(categories);
};

export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  const category = await Category.findById(id).populate("parentCategory");
  if (!category) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  res.json(category);
};

export const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  const category = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  res.json(category);
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  res.status(204).send();
};

export const getProductsByCategoryAndChildren = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  const category = await Category.findById(id).populate("parentCategory");
  if (!category) {
    return res.status(404).json({ message: "Categoría no encontrada" });
  }

  const children = await Category.find({ parentCategory: id }).select("_id");
  const categoryIds = [id, ...children.map((c) => c._id)];

  const filter = {
    category: { $in: categoryIds },
    is_active: true,
    is_deleted: false,
  };

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);

  const [products, totalResults] = await Promise.all([
    Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    category,
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalResults,
      totalPages: Math.ceil(totalResults / limitNum),
    },
  });
};
