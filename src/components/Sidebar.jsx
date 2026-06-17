import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  Gauge,
  Plus,
} from "lucide-react";
import { getUser, logout, profileApi } from "../services/api";
import BottomNav from "./BottomNav";
import "../styles/Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/progres", label: "Mes Progrès", icon: BarChart3 },
  { to: "/communaute", label: "Communauté", icon: Users },
  { to: "/recommandation", label: "Trouver mon pneu", icon: Gauge },
  { to: "/profil", label: "Mon Profil", icon: User },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    profileApi
      .get(user.id)
      .then((res) => setAvatarUrl(res.data?.avatar_url || null))
      .catch(() => {});
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">
          <span className="app-sidebar-logo-m">M</span>
          <span className="app-sidebar-logo-text">MICHELIN</span>
          <span className="app-sidebar-logo-subtitle">RIDING</span>
        </div>

        <button
          className="app-sidebar-cta"
          onClick={() => navigate("/activites/nouvelle")}
        >
          <Plus size={20} />
          Nouvelle sortie
        </button>

        <nav className="app-sidebar-menu">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              className={pathname === to ? "active" : ""}
              onClick={() => navigate(to)}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>
              {label}
            </button>
          ))}

          <button disabled>
            <span className="nav-icon">
              <Settings size={19} />
            </span>
            Paramètres
          </button>
        </nav>

        {user && (
          <div className="app-sidebar-user">
            <img
              src={
                avatarUrl ||
                "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
              }
              alt={user.first_name}
            />

            <div>
              <strong>
                {user.first_name} {user.last_name}
              </strong>
              <span>Niveau {user.level ?? 1}</span>
            </div>
          </div>
        )}

        <button className="app-sidebar-logout" onClick={handleLogout}>
          <LogOut size={20} />
          Déconnexion
        </button>
      </aside>

      <BottomNav />
    </>
  );
}
