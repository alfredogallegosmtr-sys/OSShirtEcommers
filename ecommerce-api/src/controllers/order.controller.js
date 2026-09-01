import mongoose from "mongoose";
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

// Se atrapa en el error handler global (src/app.js), no con try/catch en el controller —
// mismo patrón que el duplicado de índice (code: 11000), respeta la convención del repo.
class InsufficientStockError extends Error {
  constructor(productName) {
    super(`Stock insuficiente para "${productName}"`);
    this.name = "InsufficientStockError";
  }
}

// El stock se reserva al confirmar la orden, no al agregar al carrito (S-10): el carrito no
// bloquea inventario de otros usuarios mientras alguien solo está mirando su carrito. El
// descuento es atómico por producto ($gte evita que dos órdenes concurrentes sobrevendan el
// mismo stock), y corre dentro de la misma transacción que crea la orden y vacía el carrito
// (ver createOrder) — si algo falla a mitad de camino, la transacción entera se revierte sola,
// sin necesitar un rollback manual escrito a mano.
const applyStockDecrements = async (items, session) => {
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session },
    );
    if (!updated) {
      throw new InsufficientStockError(item.name);
    }
  }
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

  const subtotalPrice = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingCost = subtotalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const totalPrice = subtotalPrice + subtotalPrice * TAX_RATE + shippingCost;

  // Descontar stock, crear la orden y vaciar el carrito son 3 escrituras separadas -- sin
  // transacción, un fallo de conexión entre la primera y la segunda dejaría stock descontado
  // sin que exista una orden, y nada lo revertiría (hallazgo real, no hipotético). El try/finally
  // de acá abajo es solo para garantizar que la sesión se cierre siempre -- no atrapa el error de
  // negocio (InsufficientStockError) ni ningún otro: sigue subiendo sin tocar, Express 5 lo
  // reenvía solo al error handler global (src/app.js), igual que el resto de los controllers.
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      await applyStockDecrements(products, session);

      const [createdOrder] = await Order.create(
        [
          {
            user: req.user.id,
            products,
            address: address._id,
            paymentMethod: paymentMethod._id,
            subtotalPrice,
            shippingCost,
            totalPrice,
          },
        ],
        { session },
      );
      order = createdOrder;

      cart.products = [];
      cart.total = 0;
      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await order.populate("products.productId");
  await order.populate("address");
  await order.populate("paymentMethod");

  res.status(201).json(order);
};
