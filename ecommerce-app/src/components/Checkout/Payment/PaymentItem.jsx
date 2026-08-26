import Button from "../../common/Button";
import "./PaymentItem.css";

const BRAND_LABELS = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  other: "Tarjeta",
};

const PaymentItem = ({ payment, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <div
      className={`payment-item ${isSelected ? "selected" : ""} ${
        payment.isDefault ? "isDefault" : ""
      }`}
    >
      <div className="payment-content">
        <h4>{BRAND_LABELS[payment.brand] || "Método de pago"}</h4>
        <p>**** **** **** {payment.last4 || "----"}</p>
        <p>Vence: {payment.expiryDate}</p>
        <p>Titular: {payment.cardHolderName}</p>
        {payment.isDefault && (
          <span className="isDefault-badge">Predeterminada</span>
        )}
      </div>
      <div className="payment-actions">
        <Button onClick={() => onSelect(payment)} disabled={isSelected}>
          {isSelected ? "Seleccionada" : "Seleccionar"}
        </Button>
        <Button variant="secondary" onClick={() => onEdit(payment)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(payment)}>
          Eliminar
        </Button>
      </div>
    </div>
  );
};

export default PaymentItem;
