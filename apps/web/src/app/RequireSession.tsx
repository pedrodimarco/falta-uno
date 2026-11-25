import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../features/session/useSession";
import { Loading } from "../shared/components/Loading";

/** Navigation guard only. The API must authorize trial accounts independently. */
export function RequireSession() {
  const { person, ready } = useSession();
  if (!ready) return <Loading />;
  if (!person?.email) return <Navigate to="/" replace />;
  return <Outlet />;
}
