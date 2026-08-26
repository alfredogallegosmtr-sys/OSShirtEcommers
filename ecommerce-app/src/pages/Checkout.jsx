import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import AddressForm from "../components/Checkout/Address/AddressForm";
import AddressList from "../components/Checkout/Address/AddressList";
import PaymentForm from "../components/Checkout/Payment/PaymentForm";
import PaymentList from "../components/Checkout/Payment/PaymentList";
import SummarySection from "../components/Checkout/shared/SummarySection";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { useCart } from "../context/CartContext";
import {
  getPaymentMethods as fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../services/paymentMethodService";
import {
  getAddresses as fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../services/addressService";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, total, clearCart } = useCart();

  // --- LÓGICA DE NEGOCIO FINANCIERA ---
  // Cálculos derivados del estado del carrito.
  // Se realizan en cada render para asegurar consistencia.
  const subtotal = typeof total === "number" ? total : 0;
  const TAX_RATE = 0.16; // IVA 16%
  const SHIPPING_RATE = 350; // Costo de envío estándar
  const FREE_SHIPPING_THRESHOLD = 1000; // Envío gratis si subtotal >= 1000

  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );
  const [isOrderFinished, setIsOrderFinished] = useState(false);

  // Utilidad para formatear moneda (MXN)
  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  // --- EFECTOS Y REFERENCIAS ---

  // Efecto de protección de ruta:
  // Si el carrito está vacío y no estamos en proceso de confirmación, redirigir al carrito.
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [cartItems, navigate, isOrderFinished]);

  // --- ESTADOS LOCALES (Gestión de UI y Datos) ---

  // Datos principales (Direcciones y Pagos)
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);

  // Estados de carga y error para la obtención inicial de datos
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState(null);

  // Control de visibilidad de formularios (Modo Edición/Creación)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Elementos que se están editando actualmente (null si es creación)
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // Control de acordeones/secciones expandidas
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);

  // Selección actual del usuario
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // --- CARGA DE DATOS INICIAL ---
  useEffect(() => {
    /**
     * Función asíncrona para cargar datos iniciales.
     * Obtiene direcciones y métodos de pago en paralelo.
     * Establece los valores por defecto si existen.
     */
    async function loadData() {
      setLoadingLocal(true);
      setLocalError(null);
      try {
        // Carga paralela de datos para mejorar performance
        const [addrList, payList] = await Promise.all([
          fetchAddresses(),
          fetchPaymentMethods(),
        ]);

        setAddresses(addrList || []);
        setPayments(payList || []);

        // Pre-seleccionar valores por defecto (ninguna de las dos APIs tiene un
        // endpoint de "default" separado: se deriva de isDefault en la lista real).
        const firstAddress =
          addrList?.find((addr) => addr.isDefault) || addrList?.[0] || null;
        const firstPayment =
          payList?.find((pay) => pay.isDefault) || payList?.[0] || null;
        setSelectedAddress(firstAddress);
        setSelectedPayment(firstPayment);

        // Abrir secciones si no hay datos seleccionados
        setAddressSectionOpen(!firstAddress);
        setPaymentSectionOpen(!firstPayment);
      } catch (err) {
        setLocalError("No se pudo cargar direcciones o métodos de pago.");
      } finally {
        setLoadingLocal(false);
      }
    }

    loadData();
  }, []);

  // --- HANDLERS PARA DIRECCIONES (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de direcciones.
   * Cierra el formulario si estaba abierto.
   */
  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona una dirección existente y cierra el acordeón.
   * @param {Object} address - La dirección seleccionada.
   */
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de una nueva dirección.
   * Abre el formulario en modo creación.
   */
  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de una dirección existente.
   * Abre el formulario precargado con los datos de la dirección.
   * @param {Object} address - La dirección a editar.
   */
  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  /**
   * Elimina una dirección vía API real y actualiza la lista local.
   * Si la dirección eliminada estaba seleccionada, intenta seleccionar otra.
   */
  const handleAddressDelete = async (address) => {
    try {
      await deleteAddress(address._id);
      const updatedAddresses = addresses.filter((add) => add._id !== address._id);
      if (selectedAddress?._id === address._id) {
        setSelectedAddress(updatedAddresses[0] || null);
      }
      setAddresses(updatedAddresses);
    } catch (err) {
      setLocalError("No se pudo eliminar la dirección.");
    }
  };

  /**
   * Maneja el guardado (Creación o Edición) de una dirección vía API real.
   * Re-consulta la lista completa después: el backend puede desmarcar `isDefault`
   * en otras direcciones del usuario (regla de negocio server-side), y replicar esa
   * lógica a mano en el cliente divergiría de la fuente de verdad real.
   */
  const handleAddressSubmit = async (formData) => {
    try {
      const saved = editingAddress
        ? await updateAddress(editingAddress._id, formData)
        : await createAddress(formData);

      const refreshed = await fetchAddresses();
      setAddresses(refreshed || []);
      setSelectedAddress(
        refreshed?.find((addr) => addr._id === saved._id) || saved
      );
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressSectionOpen(false);
    } catch (err) {
      setLocalError("No se pudo guardar la dirección.");
    }
  };

  /**
   * Cancela la operación actual (creación o edición) de dirección.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  // --- HANDLERS PARA PAGOS (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de pagos.
   * Cierra el formulario si estaba abierto.
   */
  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona un método de pago existente y cierra el acordeón.
   * @param {Object} payment - El método de pago seleccionado.
   */
  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de un nuevo método de pago.
   * Abre el formulario en modo creación.
   */
  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPayment(null);
    setPaymentSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de un método de pago existente.
   * Abre el formulario precargado con los datos del pago.
   * @param {Object} payment - El método de pago a editar.
   */
  const handlePaymentEdit = (payment) => {
    setShowPaymentForm(true);
    setEditingPayment(payment);
    setPaymentSectionOpen(true);
  };

  /**
   * Elimina un método de pago vía API real y actualiza la lista local.
   * Si el pago eliminado estaba seleccionado, intenta seleccionar otro.
   * @param {Object} payment - El método de pago a eliminar.
   */
  const handlePaymentDelete = async (payment) => {
    try {
      await deletePaymentMethod(payment._id);
      const updatedPayments = payments.filter((pay) => pay._id !== payment._id);
      if (selectedPayment?._id === payment._id) {
        setSelectedPayment(updatedPayments[0] || null);
      }
      setPayments(updatedPayments);
    } catch (err) {
      setLocalError("No se pudo eliminar el método de pago.");
    }
  };

  /**
   * Maneja el guardado (Creación o Edición) de un método de pago vía API real.
   * Re-consulta la lista completa después: el backend puede desmarcar `isDefault`
   * en los demás métodos del usuario (misma regla server-side que en direcciones).
   * @param {Object} formData - Datos del formulario de pago (ya sin número completo ni cvv).
   */
  const handlePaymentSubmit = async (formData) => {
    try {
      const saved = editingPayment
        ? await updatePaymentMethod(editingPayment._id, formData)
        : await createPaymentMethod(formData);

      const refreshed = await fetchPaymentMethods();
      setPayments(refreshed || []);
      setSelectedPayment(
        refreshed?.find((pay) => pay._id === saved._id) || saved
      );
      setShowPaymentForm(false);
      setEditingPayment(null);
      setPaymentSectionOpen(false);
    } catch (err) {
      setLocalError("No se pudo guardar el método de pago.");
    }
  };

  /**
   * Cancela la operación actual (creación o edición) de pago.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  // --- FINALIZACIÓN DE ORDEN ---

  /**
   * Crea el objeto de orden final y simula el envío.
   * Guarda en localStorage para persistencia simple y redirige.
   */
  const handleCreateOrder = () => {
    if (
      !selectedAddress ||
      !selectedPayment ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return;
    }

    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cartItems.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        imageURL: item.product.imageURL,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      subtotal,
      tax: taxAmount,
      shipping: shippingCost,
      total: grandTotal,
      shippingAddress: selectedAddress,
      paymentMethod: selectedPayment,
      status: "confirmed",
    };

    // Simulación de persistencia
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    setIsOrderFinished(true);
    navigate("/order-confirmation", { state: { order } });
    clearCart();
  };

  return (
    // Mostrar loading o error antes del contenido principal
    loadingLocal ? (
      <Loading message="Cargando direcciones y métodos de pago..." />
    ) : localError ? (
      <ErrorMessage message={localError} />
    ) : (
      <div className="checkout-container">
        <div className="checkout-left">
          <SummarySection
            title="1. Dirección de envío"
            selected={selectedAddress}
            summaryContent={
              <div className="selected-address">
                <p>{selectedAddress?.address}</p>
                <p>
                  {selectedAddress?.city}, {selectedAddress?.state} —{" "}
                  {selectedAddress?.postalCode}
                </p>
              </div>
            }
            isExpanded={
              showAddressForm || addressSectionOpen || !selectedAddress
            }
            onToggle={handleAddressToggle}
          >
            {!showAddressForm && !editingAddress ? (
              <AddressList
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={handleSelectAddress}
                onEdit={handleAddressEdit}
                onAdd={handleAddressNew}
                onDelete={handleAddressDelete}
              />
            ) : (
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={handleCancelAddress}
                initialValues={editingAddress || {}}
                isEdit={!!editingAddress}
              />
            )}
          </SummarySection>

          <SummarySection
            title="2. Método de pago"
            selected={selectedPayment}
            summaryContent={
              <div className="selected-payment">
                {selectedPayment?.type === "paypal" ? (
                  <p>PayPal — {selectedPayment?.paypalEmail}</p>
                ) : (
                  <>
                    <p>{selectedPayment?.cardHolderName}</p>
                    <p>**** **** **** {selectedPayment?.last4 || "----"}</p>
                  </>
                )}
              </div>
            }
            isExpanded={
              showPaymentForm || paymentSectionOpen || !selectedPayment
            }
            onToggle={handlePaymentToggle}
          >
            {!showPaymentForm && !editingPayment ? (
              <PaymentList
                payments={payments}
                selectedPayment={selectedPayment}
                onSelect={handleSelectPayment}
                onEdit={handlePaymentEdit}
                onAdd={handlePaymentNew}
                onDelete={handlePaymentDelete}
              />
            ) : (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancelPayment}
                initialValues={editingPayment || {}}
                isEdit={!!editingPayment}
              />
            )}
          </SummarySection>

          <SummarySection
            title="3. Revisa tu pedido"
            selected={true}
            isExpanded={true}
          >
            <CartView />
          </SummarySection>
        </div>

        <div className="checkout-right">
          <div className="checkout-summary">
            <h3>Resumen de la Orden</h3>
            <div className="summary-details">
              <p>
                <strong>Dirección de envío:</strong> {selectedAddress?.address}
              </p>
              <p>
                <strong>Método de pago:</strong>{" "}
                {selectedPayment?.type === "paypal"
                  ? "PayPal"
                  : `**** ${selectedPayment?.last4 || "----"}`}
              </p>
              <div className="order-costs">
                <p>
                  <strong>Subtotal:</strong> {formatMoney(subtotal)}
                </p>
                <p>
                  <strong>IVA (16%):</strong> {formatMoney(taxAmount)}
                </p>
                <p>
                  <strong>Envío:</strong>{" "}
                  {shippingCost === 0 ? "Gratis" : formatMoney(shippingCost)}
                </p>
                <hr />
                <p>
                  <strong>Total:</strong> {formatMoney(grandTotal)}
                </p>
              </div>
              <p>
                <strong>Fecha estimada de entrega:</strong>{" "}
                {new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <Button
              className="pay-button"
              disabled={
                !selectedAddress ||
                !selectedPayment ||
                !cartItems ||
                cartItems.length === 0
              }
              title={
                !cartItems || cartItems.length === 0
                  ? "No hay productos en el carrito"
                  : !selectedAddress
                  ? "Selecciona una dirección de envío"
                  : !selectedPayment
                  ? "Selecciona un método de pago"
                  : "Confirmar y realizar el pago"
              }
              onClick={handleCreateOrder}
            >
              Confirmar y Pagar
            </Button>
          </div>
        </div>
      </div>
    )
  );
}
