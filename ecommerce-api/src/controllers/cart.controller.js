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
  const clientTimestamp = Number(req.body.clientTimestamp);
  const hasClientTimestamp = Number.isFinite(clientTimestamp);

  if (!mongoose.isValidObjectId(itemId)) {
    return res.status(404).json({ message: "Item no encontrado" });
  }
  if (!Number.isFinite(qty) || qty < 1) {
    return res.status(422).json({ message: "Cantidad inválida" });
  }

  // Dos PATCH al mismo item pueden llegar al servidor en un orden distinto al que el usuario
  // los disparó (red real, no localhost) -- "última escritura gana" en el servidor no es lo
  // mismo que "el último clic del usuario gana". Si el cliente manda clientTimestamp (Date.now()
  // capturado en el momento del clic, no de la respuesta), se descarta cualquier PATCH más
  // viejo que el último ya aplicado para ese item, en vez de dejar que gane el que llegue último.
  const filter = hasClientTimestamp
    ? {
        user: req.user.id,
        products: {
          $elemMatch: {
            _id: itemId,
            $or: [
              { lastClientTimestamp: { $exists: false } },
              { lastClientTimestamp: { $lte: clientTimestamp } },
            ],
          },
        },
      }
    : { user: req.user.id, "products._id": itemId };

  const update = hasClientTimestamp
    ? { $set: { "products.$.quantity": qty, "products.$.lastClientTimestamp": clientTimestamp } }
    : { $set: { "products.$.quantity": qty } };

  // Actualización atómica sobre el elemento exacto del array -- evita el read-modify-write
  // (findOne + mutar + cart.save(), usado en el resto de este archivo) que abriría una ventana
  // entre leer y guardar donde otra escritura concurrente podría perderse.
  let cart = await Cart.findOneAndUpdate(filter, update, { new: true });

  if (!cart) {
    const stillExists = await Cart.exists({ user: req.user.id, "products._id": itemId });
    if (!stillExists) {
      return res.status(404).json({ message: "Item no encontrado" });
    }
    // El item existe, pero este PATCH quedó descartado por ser más viejo que uno ya aplicado
    // (llegó desordenado) -- no es un error del cliente, se responde con el estado real actual.
    cart = await Cart.findOne({ user: req.user.id });
  }

  // El total es un valor derivado que se recalcula en cada operación de carrito -- se persiste
  // aparte con un $set puntual (no cart.save()) para no reescribir "products" con una copia
  // en memoria que podría ya estar desactualizada frente a otra escritura concurrente.
  await cart.populate("products.product");
  recalcTotal(cart);
  await Cart.updateOne({ _id: cart._id }, { $set: { total: cart.total } });
  res.json({ items: toItems(cart), total: cart.total });
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
