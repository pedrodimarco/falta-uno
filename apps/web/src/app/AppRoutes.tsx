import { Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { HomePage } from "../pages/HomePage";
import { CreateMatchPage } from "../pages/CreateMatchPage";
import { MatchDetailPage } from "../pages/MatchDetailPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/LoginPage";
import { VerifyLoginPage } from "../pages/VerifyLoginPage";
import { AppLayout } from "./AppLayout";
import { RequireSession } from "./RequireSession";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout showNavigation={false} />}>
        <Route path="ingresar" element={<LoginPage />} />
        <Route path="acceso" element={<VerifyLoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireSession />}>
        <Route element={<AppLayout />}>
          <Route path="partidos" element={<HomePage />} />
          <Route path="partidos/nuevo" element={<CreateMatchPage />} />
          <Route path="partidos/:id" element={<MatchDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
