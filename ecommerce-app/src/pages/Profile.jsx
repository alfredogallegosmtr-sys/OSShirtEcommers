import ProfileCard from "../components/ProfileCard/ProfileCard";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import { getMe } from "../services/userService";
import useFetch from "../hooks/useFetch";

export default function Profile() {
  const { data: profile, loading, error: fetchError } = useFetch(() => getMe(), []);
  const error = fetchError ? "No se pudo cargar tu perfil." : null;

  if (loading) return <Loading>Cargando tu perfil...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return <ProfileCard userProp={profile} />;
}
