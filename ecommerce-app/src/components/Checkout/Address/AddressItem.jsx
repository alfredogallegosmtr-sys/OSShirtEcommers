import Button from "../../common/Button";
import "./AddressItem.css";

const AddressItem = ({ address, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <div
      className={`address-item ${isSelected ? "selected" : ""} ${
        address.isDefault ? "default" : ""
      }`}
    >
      <div className="address-content">
        <h4>{address.address}</h4>
        <p>
          {address.city}, {address.state} — {address.postalCode}
        </p>
        <p>{address.country}</p>
        <p>{address.phone}</p>
        {address.isDefault && (
          <span className="default-badge">Predeterminada</span>
        )}
      </div>
      <div className="address-actions">
        <Button onClick={() => onSelect(address)} disabled={isSelected}>
          {isSelected ? "Seleccionada" : "Seleccionar"}
        </Button>
        <Button variant="secondary" onClick={() => onEdit(address)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(address)}>
          Eliminar
        </Button>
      </div>
    </div>
  );
};

export default AddressItem;
