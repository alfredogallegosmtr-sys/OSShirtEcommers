import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./PaymentForm.css";

// Decisión S-03 (docs/backlog.md): el backend nunca acepta el número completo de tarjeta ni
// el cvv, ni siquiera para descartarlos — por eso este formulario no pide cvv en absoluto, y
// el número de tarjeta que el usuario escribe nunca sale de este componente: solo se usa para
// derivar `last4`/`brand` antes de enviar el formulario.
const deriveBrand = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("5")) return "mastercard";
  if (digits.startsWith("3")) return "amex";
  return "other";
};

const EMPTY_FORM = {
  cardNumber: "",
  cardHolderName: "",
  expiryDate: "",
  isDefault: false,
};

const PaymentForm = ({ onSubmit, onCancel, initialValues = {}, isEdit = false }) => {
  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    // En edición no reconstruimos el número completo (nunca lo tuvimos) — solo mostramos
    // los últimos 4 dígitos ya guardados para dar contexto visual.
    cardNumber: initialValues.last4 ? `**** **** **** ${initialValues.last4}` : "",
    cardHolderName: initialValues.cardHolderName || "",
    expiryDate: initialValues.expiryDate || "",
    isDefault: initialValues.isDefault || false,
  });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        cardNumber: initialValues.last4 ? `**** **** **** ${initialValues.last4}` : "",
        cardHolderName: initialValues.cardHolderName || "",
        expiryDate: initialValues.expiryDate || "",
        isDefault: initialValues.isDefault || false,
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const digits = formData.cardNumber.replace(/\D/g, "");
    const payload = {
      type: "credit_card",
      cardHolderName: formData.cardHolderName,
      expiryDate: formData.expiryDate,
      isDefault: formData.isDefault,
    };
    // Solo se derivan last4/brand si el usuario escribió un número nuevo (4+ dígitos reales).
    // En edición, si no tocó el campo, se preserva last4/brand ya guardados (no se envían de
    // nuevo, el backend simplemente no los toca si no vienen en el body).
    if (digits.length >= 4) {
      payload.last4 = digits.slice(-4);
      payload.brand = deriveBrand(digits);
    }

    onSubmit(payload);

    if (!isEdit) {
      setFormData(EMPTY_FORM);
    }
  };

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Editar Método de Pago" : "Nuevo Método de Pago"}</h3>

      <Input
        label="Número de tarjeta"
        name="cardNumber"
        value={formData.cardNumber}
        onChange={handleChange}
        placeHolder="1234 5678 9012 3456"
        required={!isEdit}
      />
      <p className="payment-form-hint">
        Solo se guardan los últimos 4 dígitos — el número completo nunca se envía ni se
        almacena.
      </p>

      <Input
        label="Nombre del titular"
        name="cardHolderName"
        value={formData.cardHolderName}
        onChange={handleChange}
        required
      />

      <Input
        label="Fecha de expiración"
        name="expiryDate"
        value={formData.expiryDate}
        onChange={handleChange}
        placeHolder="MM/YY"
        pattern="[0-9]{2}/[0-9]{2}"
        required
      />

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          id="isDefaultPayment"
        />
        <label htmlFor="isDefaultPayment">
          Establecer como método de pago predeterminado
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Guardar Cambios" : "Agregar Método de Pago"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

export default PaymentForm;
