import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
      ],
    },
    // Decisión S-03 (docs/backlog.md): nunca se guarda el número completo de tarjeta ni el cvv,
    // ni siquiera cifrado — solo lo necesario para mostrarlo en UI ("terminada en 1111"). El
    // cobro real de un checkout con tarjeta debe delegarse a un proveedor externo (Stripe,
    // PayPal, etc.) que devuelva un token; ese token no existe todavía porque el checkout sigue
    // simulado (ver docs/PROJECT_STATUS.md).
    last4: {
      type: String,
      trim: true,
      maxlength: 4,
    },
    brand: {
      type: String,
      trim: true,
    },
    cardHolderName: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: String,
    },
    paypalEmail: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;