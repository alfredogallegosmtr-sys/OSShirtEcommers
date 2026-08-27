import { useCart } from "../../context/CartContext";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";

export default function CartView() {
  const { cartItems, removeItem, updateQuantity } = useCart();

  return (
    <div className="cart-view">
      <div className="cart-view-header">
        <h2>
          {cartItems.length}{" "}
          {cartItems.length === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      {cartItems &&
        cartItems.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-image">
              <img
                src={
                  item.product.imageURL ||
                  item.product.images?.[0] ||
                  "/img/products/placeholder.svg"
                }
                alt={item.product.name}
                loading="lazy"
              />
            </div>

            <div className="cart-item-info">
              <h3>{item.product.name}</h3>
              <p className="cart-item-price">{`$${item.product.price.toFixed(2)}`}</p>
            </div>

            <div className="cart-item-quantity">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Disminuir cantidad"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Icon name="minus" size={15}></Icon>
              </Button>
              <span data-testid={`cart-item-quantity-${item.product._id}`}>
                {item.quantity}
              </span>
              <Button
                variant="secondary"
                size="sm"
                aria-label="Aumentar cantidad"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Icon name="plus" size={15}></Icon>
              </Button>
            </div>

            <div className="cart-item-total">
              ${(item.product.price * item.quantity).toFixed(2)}
            </div>

            <Button
              variant="ghost"
              className="danger"
              size="sm"
              onClick={() => removeItem(item.id)}
              title="Eliminar artículo"
            >
              <Icon name="trash" size={16} />
            </Button>
          </div>
        ))}
    </div>
  );
}