import mongoose from "mongoose";
import Cart from "../models/Cart.js";

const toItems = (cart) =>
  cart.products.map((entry) => ({
    id: entry._id,
    quantity: entry.quantity,
    product: entry.product,
  }));

const recalcTotal = (cart) => {
  cart.total = cart.products.reduce((sum, entry) => {
    const price = entry.product?.price ?? 0;
    return sum + price * entry.quantity;
  }, 0);
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, products: [] });
  }
  return cart;
};

const respondWithCart = async (cart, res) => {
  await cart.populate("products.product");
  recalcTotal(cart);
  await cart.save();
  res.json({ items: toItems(cart), total: cart.total });
};

export const getCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  await respondWithCart(cart, res);
};

export const addItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(422).json({ message: "productId inválido" });
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const cart = await getOrCreateCart(req.user.id);

  const existing = cart.products.find(
    (entry) => entry.product.toString() === productId,
  );
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.products.push({ product: productId, quantity: qty });
  }

  await respondWithCart(cart, res);
};

export const updateQuantity = async (req, res) => {
  const { itemId } = req.params;
  const qty = Number(req.body.quantity);

  if (!mongoose.isValidObjectId(itemId)) {
    return res.status(404).json({ message: "Item no encontrado" });
  }
  if (!Number.isFinite(qty) || qty < 1) {
    return res.status(422).json({ message: "Cantidad inválida" });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  const entry = cart?.products.id(itemId);
  if (!cart || !entry) {
    return res.status(404).json({ message: "Item no encontrado" });
  }

  entry.quantity = qty;
  await respondWithCart(cart, res);
};

export const removeItem = async (req, res) => {
  const { itemId } = req.params;

  if (!mongoose.isValidObjectId(itemId)) {
    return res.status(404).json({ message: "Item no encontrado" });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  const entry = cart?.products.id(itemId);
  if (!cart || !entry) {
    return res.status(404).json({ message: "Item no encontrado" });
  }

  cart.products.pull(itemId);
  await respondWithCart(cart, res);
};

export const clearCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.products = [];
  cart.total = 0;
  await cart.save();
  res.json({ items: [], total: 0 });
};
