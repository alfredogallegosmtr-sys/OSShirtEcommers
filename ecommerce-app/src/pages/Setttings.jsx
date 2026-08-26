import { useEffect, useState } from "react";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Input from "../components/common/Input";
import Loading from "../components/common/Loading/Loading";
import { getMe, updateMe, changePassword } from "../services/userService";
import "./Setttings.css";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const user = await getMe();
        if (!cancelled) {
          setProfileForm({ name: user.name || "", email: user.email || "" });
        }
      } catch (err) {
        if (!cancelled) setLoadError("No se pudo cargar tu información.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      await updateMe(profileForm);
      setProfileSuccess(true);
    } catch (err) {
      const message =
        err.original?.response?.data?.message === "User already exist"
          ? "Ese email ya está en uso por otra cuenta."
          : "No se pudo actualizar tu perfil.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordForm);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      const message =
        err.original?.response?.status === 401
          ? "La contraseña actual no es correcta."
          : "No se pudo cambiar tu contraseña.";
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <Loading>Cargando tu configuración...</Loading>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="settings-page">
        <ErrorMessage>{loadError}</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <p className="eyebrow">Tu cuenta</p>
        <h1>Configuración</h1>
      </div>

      <section className="settings-section card">
        <h2>Editar perfil</h2>
        <form onSubmit={handleProfileSubmit} className="settings-form">
          <Input
            label="Nombre"
            name="name"
            value={profileForm.name}
            onChange={handleProfileChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={profileForm.email}
            onChange={handleProfileChange}
            required
          />
          {profileError && <ErrorMessage>{profileError}</ErrorMessage>}
          {profileSuccess && (
            <div className="success-message">Perfil actualizado correctamente.</div>
          )}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </section>

      <section className="settings-section card">
        <h2>Cambiar contraseña</h2>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <Input
            label="Contraseña actual"
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            name="confirmNewPassword"
            type="password"
            value={passwordForm.confirmNewPassword}
            onChange={handlePasswordChange}
            required
          />
          {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
          {passwordSuccess && (
            <div className="success-message">Contraseña actualizada correctamente.</div>
          )}
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </form>
      </section>
    </div>
  );
}
