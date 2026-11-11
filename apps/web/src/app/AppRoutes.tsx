import { Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { CreateMatchPage } from "../pages/CreateMatchPage";
import { MatchDetailPage } from "../pages/MatchDetailPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/LoginPage";
import { VerifyLoginPage } from "../pages/VerifyLoginPage";
import { AppLayout } from "./AppLayout";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="ingresar" element={<LoginPage />} />
        <Route path="acceso" element={<VerifyLoginPage />} />
        <Route index element={<HomePage />} />
        <Route path="partidos/nuevo" element={<CreateMatchPage />} />
        <Route path="partidos/:id" element={<MatchDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
