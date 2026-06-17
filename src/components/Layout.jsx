import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import "../styles/Layout.css";

export default function Layout() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <MobileHeader />
      <Sidebar />
      <main className="app-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
