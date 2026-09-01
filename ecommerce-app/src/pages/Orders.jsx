import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import { getOrders } from "../services/orderService";
import useFetch from "../hooks/useFetch";
import "./Orders.css";

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const formatDate = (isoString) => {
  if (!isoString) return "Fecha desconocida";
  try {
    return new Date(isoString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "Fecha inválida";
  }
};

export default function Orders() {
  const { data: fetchedOrders, loading, error: fetchError } = useFetch(() => getOrders(), []);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const orders = fetchedOrders || [];
  const error = fetchError ? "No se pudieron cargar tus pedidos." : null;

  // Selección por defecto (la más reciente) calculada en el render, no en un efecto: así no
  // hace falta un ciclo de render extra para que aparezca seleccionada la primera vez que los
  // pedidos llegan -- `selectedOrderId` solo se usa una vez el usuario elige otra explícitamente.
  const effectiveSelectedOrderId = selectedOrderId ?? orders[0]?._id ?? null;

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === effectiveSelectedOrderId) || null,
    [orders, effectiveSelectedOrderId]
  );

  const detailStatusToken = selectedOrder
    ? (selectedOrder.status || "pending").toLowerCase()
    : "pending";
  const detailStatusLabel = selectedOrder?.status || "Pendiente";

  if (loading) {
    return (
      <div className="orders-page">
        <Loading>Cargando tus pedidos...</Loading>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page orders-empty">
        <Icon name="package" size={48} />
        <h1>No pudimos cargar tus pedidos</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="orders-page orders-empty">
        <Icon name="package" size={48} />
        <h1>No tienes pedidos todavía</h1>
        <p>
          Cada vez que confirmes una compra en el checkout, la orden queda
          guardada en tu cuenta para consultarla más tarde, desde cualquier
          dispositivo.
        </p>
        <Link to="/" className="orders-link">
          <Button>Descubrir productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="eyebrow">Historial de compras</p>
          <h1>Mis pedidos</h1>
          <p className="muted">
            {orders.length === 1
              ? "Tienes 1 pedido en tu cuenta"
              : `Tienes ${orders.length} pedidos en tu cuenta`}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setSelectedOrderId(orders[0]?._id ?? null)}
        >
          Ver más reciente
        </Button>
      </div>

      <div className="orders-content">
        <div className="orders-list card">
          <div className="orders-list-header">
            <h2>Pedidos</h2>
            <span>{orders.length}</span>
          </div>
          <div className="orders-list-body">
            {orders.map((order) => {
              const itemCount = order.products?.length || 0;
              const statusToken = (order.status || "pending").toLowerCase();
              const isActive = effectiveSelectedOrderId === order._id;
              return (
                <button
                  key={order._id}
                  className={`order-card${isActive ? " active" : ""}`}
                  onClick={() => setSelectedOrderId(order._id)}
                >
                  <div className="order-card-head">
                    <span className="order-id">#{order._id}</span>
                    <span
                      className={`order-status order-status-${statusToken}`}
                    >
                      {order.status || "Pendiente"}
                    </span>
                  </div>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                  <div className="order-card-meta">
                    <span>{itemCount} artículos</span>
                    <strong>{formatMoney(order.totalPrice || 0)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="orders-detail card">
          {selectedOrder ? (
            <>
              <div className="order-detail-header">
                <div>
                  <p className="eyebrow">Pedido #{selectedOrder._id}</p>
                  <h2>{formatMoney(selectedOrder.totalPrice || 0)}</h2>
                  <p className="muted">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <span
                  className={`order-status order-status-${detailStatusToken}`}
                >
                  {detailStatusLabel}
                </span>
              </div>

              <div className="order-section">
                <h3>Resumen del pago</h3>
                <ul className="order-summary-list">
                  <li>
                    <span>Subtotal</span>
                    <strong>{formatMoney(selectedOrder.subtotalPrice || 0)}</strong>
                  </li>
                  <li>
                    <span>IVA</span>
                    <strong>
                      {formatMoney(
                        Math.max(
                          0,
                          (selectedOrder.totalPrice || 0) -
                            (selectedOrder.subtotalPrice || 0) -
                            (selectedOrder.shippingCost || 0)
                        )
                      )}
                    </strong>
                  </li>
                  <li>
                    <span>Envío</span>
                    <strong>
                      {selectedOrder.shippingCost === 0
                        ? "Gratis"
                        : formatMoney(selectedOrder.shippingCost || 0)}
                    </strong>
                  </li>
                  <li className="order-summary-total">
                    <span>Total</span>
                    <strong>{formatMoney(selectedOrder.totalPrice || 0)}</strong>
                  </li>
                </ul>
              </div>

              <div className="order-section">
                <h3>Dirección de envío</h3>
                {selectedOrder.address ? (
                  <address className="order-address">
                    <strong>{selectedOrder.address.address}</strong>
                    <p>
                      {selectedOrder.address.city},{" "}
                      {selectedOrder.address.state} —{" "}
                      {selectedOrder.address.postalCode}
                    </p>
                    <p>{selectedOrder.address.country}</p>
                  </address>
                ) : (
                  <p className="muted">Sin dirección registrada.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Método de pago</h3>
                {selectedOrder.paymentMethod ? (
                  <div>
                    {selectedOrder.paymentMethod.type === "paypal" ? (
                      <p>PayPal — {selectedOrder.paymentMethod.paypalEmail}</p>
                    ) : (
                      <>
                        <p>{selectedOrder.paymentMethod.cardHolderName}</p>
                        <p>
                          **** **** ****{" "}
                          {selectedOrder.paymentMethod.last4 || "----"}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="muted">Sin método de pago registrado.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Productos</h3>
                <ul className="order-items">
                  {selectedOrder.products?.map((item, index) => (
                    <li key={item.productId?._id || index}>
                      <div>
                        <p>{item.productId?.name || "Producto"}</p>
                        <span>
                          Cantidad: {item.quantity || 1} · Precio:{" "}
                          {formatMoney(item.price || 0)}
                        </span>
                      </div>
                      <strong>
                        {formatMoney((item.price || 0) * (item.quantity || 1))}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="orders-empty">
              <h3>Selecciona un pedido de la lista</h3>
              <p className="muted">
                Aquí verás el detalle completo: productos, dirección y método de
                pago utilizados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
