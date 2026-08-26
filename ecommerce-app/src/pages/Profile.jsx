import { useEffect, useState } from "react";
import ProfileCard from "../components/ProfileCard/ProfileCard";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import { getMe } from "../services/userService";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMe();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError("No se pudo cargar tu perfil.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading>Cargando tu perfil...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return <ProfileCard userProp={profile} />;
}
