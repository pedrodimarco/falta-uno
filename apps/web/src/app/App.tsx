import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "../features/session/SessionProvider";
import { AppRoutes } from "./AppRoutes";

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}
