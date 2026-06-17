import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getUser, logout, profileApi } from "../services/api";
import "../styles/MobileHeader.css";
import {ChevronDown} from "lucide-react";
export default function MobileHeader() {
  const navigate = useNavigate();
  const user = getUser();
  const menuRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    profileApi.get(user.id)
      .then((res) => setAvatarUrl(res.data?.avatar_url || null))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate("/login");
  };

  return (
    <header className={`mobile-header${hidden ? " mobile-header--hidden" : ""}`}>
      <div className="mobile-header-logo">
        <div className="mobile-header-logo-badge">
          <img src="/logo/1.png " alt="MICHELIN" />
        </div>

      </div>
      <div className="mobile-header-content">
        <span className="mobile-header-title">MICHELIN</span>
        <span className="mobile-header-riding">RIDING</span>
      </div>
      <div
        className="mobile-header-user"
        ref={menuRef}
        onClick={() => setShowMenu((v) => !v)}
      >
        <img
          src={
            avatarUrl ||
            "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
          }
          alt={user?.first_name || "Utilisateur"}
        />
        <ChevronDown size={22} />

        {showMenu && (
          <div className="mobile-header-dropdown">
            <div className="mobile-header-user-info">
              <strong>{user?.first_name} {user?.last_name}</strong>
              <span>Niveau {user?.level ?? 1}</span>
            </div>
            <div className="mobile-header-dropdown-divider" />
            <button onClick={handleLogout}>
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
