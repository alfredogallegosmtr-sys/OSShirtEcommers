import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import PaymentMethod from "../models/PaymentMethod.js";
import Product from "../models/Product.js";

// Mismas constantes de negocio que ya usaba Checkout.jsx en el frontend — movidas aquí para
// que el total no dependa de lo que mande el cliente (riesgo ya documentado en docs/backlog.md).
const TAX_RATE = 0.16;
const SHIPPING_RATE = 350;
const FREE_SHIPPING_THRESHOLD = 1000;

// El stock se reserva al confirmar la orden, no al agregar al carrito (S-10): el carrito no
// bloquea inventario de otros usuarios mientras alguien solo está mirando su carrito. El
// descuento es atómico por producto ($gte evita que dos órdenes concurrentes sobrevendan el
// mismo stock); si un producto falla a mitad de la lista, se revierte lo ya descontado.
const applyStockDecrements = async (items) => {
  const applied = [];
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );
    if (!updated) {
      await Promise.all(
        applied.map((done) =>
          Product.findByIdAndUpdate(done.productId, { $inc: { stock: done.quantity } }),
        ),
      );
      return item;
    }
    applied.push(item);
  }
  return null;
};

export const getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("products.productId")
    .populate("address")
    .populate("paymentMethod");
  res.json(orders);
};

export const createOrder = async (req, res) => {
  const { addressId, paymentMethodId } = req.body;

  const [address, paymentMethod, cart] = await Promise.all([
    Address.findOne({ _id: addressId, user: req.user.id }),
    PaymentMethod.findOne({ _id: paymentMethodId, user: req.user.id }),
    Cart.findOne({ user: req.user.id }).populate("products.product"),
  ]);

  if (!address) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }
  if (!paymentMethod) {
    return res.status(404).json({ message: "Método de pago no encontrado" });
  }
  if (!cart || cart.products.length === 0) {
    return res.status(422).json({ message: "El carrito está vacío" });
  }

  // Precio en el momento de la compra (snapshot), no una referencia viva al producto —
  // si el precio del producto cambia después, no debe alterar órdenes ya creadas.
  const products = cart.products.map((entry) => ({
    productId: entry.product._id,
    name: entry.product.name,
    quantity: entry.quantity,
    price: entry.product.price,
  }));

  const insufficientItem = await applyStockDecrements(products);
  if (insufficientItem) {
    return res.status(422).json({
      message: `Stock insuficiente para "${insufficientItem.name}"`,
    });
  }

  const subtotalPrice = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingCost = subtotalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const totalPrice = subtotalPrice + subtotalPrice * TAX_RATE + shippingCost;

  const order = await Order.create({
    user: req.user.id,
    products,
    address: address._id,
    paymentMethod: paymentMethod._id,
    subtotalPrice,
    shippingCost,
    totalPrice,
  });

  cart.products = [];
  cart.total = 0;
  await cart.save();

  await order.populate("products.productId");
  await order.populate("address");
  await order.populate("paymentMethod");

  res.status(201).json(order);
};
