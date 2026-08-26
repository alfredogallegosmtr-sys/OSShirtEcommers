import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import "./ProfileCard.css";

const ROLE_COLORS = {
  admin: "#2563eb",
  customer: "#22c55e",
};

export default function ProfileCard({ user, userProp }) {
  const { user: contextUser } = useAuth();
  const navigate = useNavigate();
  const currentUser = userProp || contextUser;

  const role = currentUser.role || "guest";
  const actions = [
    { label: "Editar Perfil", action: () => navigate("/settings") },
    { label: "Cambiar contraseña", action: () => navigate("/settings") },
    ...(role === "admin"
      ? [{ label: "Ver todos los pedidos", action: () => navigate("/orders") }]
      : [{ label: "Ver mis pedidos", action: () => navigate("/orders") }]),
  ];

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img
            src={currentUser.avatar || "/img/user-placeholder.png"}
            alt={
              currentUser.displayName || currentUser.name || currentUser.email
            }
            className="profile-avatar"
          />
          <div className="profile-names">
            <h2>
              {currentUser.displayName || currentUser.name || currentUser.email}
            </h2>
            <span
              className="profile-role-badge"
              style={{ background: ROLE_COLORS[role] }}
            >
              {role}
            </span>
          </div>
        </div>
        <div className="profile-info">
          <div className="info-item">
            <label>Email:</label>
            <span>{currentUser.email || "No disponible"}</span>
          </div>
          <div className="info-item">
            <label>Nombre:</label>
            <span>
              {currentUser.displayName || currentUser.name || "No disponible"}
            </span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span>{currentUser.isActive ? "Activo" : "Inactivo"}</span>
          </div>
          <div className="info-item">
            <label>Última conexión:</label>
            <span>
              {currentUser.last_login
                ? new Date(currentUser.last_login).toLocaleString()
                : "No disponible"}
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <h3>Acciones de la cuenta</h3>
          {actions.map((action, idx) => (
            <Button key={idx} type="button" onClick={action.action}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
