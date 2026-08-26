import mongoose from "mongoose";
import WishList from "../models/WishList.js";

const getOrCreateWishlist = async (userId) => {
  let wishlist = await WishList.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await WishList.create({ user: userId, products: [] });
  }
  return wishlist;
};

export const getWishlist = async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user.id);
  await wishlist.populate("products");
  res.json(wishlist);
};

export const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(422).json({ message: "productId inválido" });
  }

  const wishlist = await getOrCreateWishlist(req.user.id);
  const alreadyIn = wishlist.products.some(
    (id) => id.toString() === productId,
  );
  if (!alreadyIn) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate("products");
  res.status(201).json(wishlist);
};

export const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(404).json({ message: "Producto no encontrado en la wishlist" });
  }

  const wishlist = await getOrCreateWishlist(req.user.id);
  wishlist.products.pull(productId);
  await wishlist.save();

  await wishlist.populate("products");
  res.json(wishlist);
};
