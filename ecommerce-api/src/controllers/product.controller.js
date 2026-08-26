import mongoose from "mongoose";
import Product from "../models/Product.js";

const VISIBLE_FILTER = { is_active: true, is_deleted: false };

export const getAllProducts = async (req, res) => {
  const products = await Product.find(VISIBLE_FILTER)
    .populate("category")
    .sort({ createdAt: -1 });
  res.json({ products });
};

export const searchProducts = async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = "createdAt",
    order = "desc",
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { ...VISIBLE_FILTER };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }

  if (category && mongoose.isValidObjectId(category)) {
    filter.category = category;
  }

  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  if (inStock === "true") filter.stock = { $gt: 0 };

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 20);
  const sortOrder = order === "asc" ? 1 : -1;

  const [products, totalResults] = await Promise.all([
    Product.find(filter)
      .populate("category")
      .sort({ [sort]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalResults,
      totalPages: Math.ceil(totalResults / limitNum),
    },
  });
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  const product = await Product.findOne({ _id: id, ...VISIBLE_FILTER }).populate(
    "category",
  );
  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.json(product);
};

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { is_deleted: true },
    { new: true },
  );
  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.status(204).send();
};
