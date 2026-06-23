import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { ConnectedUserGiftListPage } from "./pages/ConnectedUserGiftListPage";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MyListDetailPage } from "./pages/MyListDetailPage";
import { MyListsPage } from "./pages/MyListsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/lists" element={<MyListsPage />} />
        <Route path="/lists/:listId" element={<MyListDetailPage />} />
        <Route path="/my-list" element={<Navigate to="/lists" replace />} />

        <Route path="/connections" element={<ConnectionsPage />} />

        <Route
          path="/connections/:userId/lists/:listId"
          element={<ConnectedUserGiftListPage />}
        />

        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;