import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, BarChart3, User, Plus } from "lucide-react";
import "../styles/BottomNav.css";

const ITEMS = [
  { icon: <Home size={22} />, label: "Accueil", path: "/" },
  { icon: <BarChart3 size={22} />, label: "Progrès", path: "/progres" },
  { icon: <Plus size={26} />, label: "Sortie", path: "/activites/nouvelle", record: true },
  { icon: <Users size={22} />, label: "Communauté", path: "/communaute" },
  { icon: <User size={22} />, label: "Profil", path: "/profil" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.path}
          className={[
            pathname === item.path ? "active" : "",
            item.record ? "record" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => navigate(item.path)}
        >
          <span className="bnav-icon">{item.icon}</span>
          <span className="bnav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
