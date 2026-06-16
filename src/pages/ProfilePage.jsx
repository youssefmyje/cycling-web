import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import {
  Home,
  BarChart3,
  Users,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  Bike,
  Medal,
  Pencil,
  Save,
  X,
  MoreHorizontal,
  CircleDot,
  Mountain,
  Route,
  Zap,
  Sun,
  Infinity,
  Activity,
} from "lucide-react";
import "../styles/ProfilePage.css";

const API_URL = "http://localhost:5000/api/profile";

const defaultTires = [
  {
    id: 1,
    brand: "MICHELIN",
    model: "POWER CUP",
    size: "700x25C",
    usageKm: 620,
    rating: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1620885346497-7273e1cf0c4b?q=80&w=800",
  },
  {
    id: 2,
    brand: "MICHELIN",
    model: "POWER ROAD",
    size: "700x28C",
    usageKm: 1150,
    rating: 4.5,
    imageUrl:
      "https://images.unsplash.com/photo-1610647752706-3bb12232b3a8?q=80&w=800",
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "Youssef",
    lastName: "M.",
    badge: "Rider Route Niveau 4",
    totalKm: 1240,
    rides: 28,
    badges: 8,
    photoUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=600",
    bikeName: "Trek Emonda SL",
    bikeType: "Route",
    bikeImageUrl:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200",
    tires: defaultTires,
  });

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Backend non disponible");
      }

      const data = await response.json();

      setProfile({
        firstName: data.firstName || "Souhail",
        lastName: data.lastName || "C.",
        badge: data.badge || "Rider Route Niveau 4",
        totalKm: data.totalKm ?? 1240,
        rides: data.rides ?? 28,
        badges: data.badges ?? 8,
        photoUrl:
          data.photoUrl ||
          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=600",
        bikeName: data.bikeName || "Trek Emonda SL",
        bikeType: data.bikeType || "Route",
        bikeImageUrl:
          data.bikeImageUrl ||
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200",
        tires: data.tires?.length ? data.tires : defaultTires,
      });
    } catch (error) {
      console.warn("Données temporaires utilisées :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTireChange = (index, field, value) => {
    setProfile((prev) => {
      const updatedTires = [...prev.tires];

      updatedTires[index] = {
        ...updatedTires[index],
        [field]: value,
      };

      return {
        ...prev,
        tires: updatedTires,
      };
    });
  };

  const saveProfile = async () => {
    const payload = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      bikeName: profile.bikeName,
      bikeType: profile.bikeType,
      bikeImageUrl: profile.bikeImageUrl,
      tires: profile.tires.map((tire) => ({
        id: tire.id,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        imageUrl: tire.imageUrl,
      })),
    };

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erreur sauvegarde");
      }

      setEditMode(false);
      getProfile();
    } catch (error) {
      console.warn(
        "Backend non prêt, modification gardée côté front :",
        error.message
      );
      setEditMode(false);
    }
  };

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <p className="loading-text">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-m">M</span>
          <span className="logo-text">MICHELIN</span>
          <span className="logo-subtitle">RIDING</span>
        </div>

        <nav className="side-menu">
          <button onClick={() => navigate("/")}>
            <Home size={22} />
            Accueil
          </button>

          <button onClick={() => navigate("/communaute")}>
            <Users size={24} />
            Communauté
          </button>

          <button onClick={() => navigate("/progres")}>
            <BarChart3 size={22} />
            Activité
          </button>

          <button className="active">
            <User size={22} />
            Mon Profil
          </button>

          <button>
            <Settings size={22} />
            Paramètres
          </button>
        </nav>

        <button
  className="home-logout"
  onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }}
>
  <LogOut size={22} />
  Déconnexion
</button>
      </aside>

      <section className="profile-panel">
        <div className="profile-avatar-wrapper">
          <img src={profile.photoUrl} alt="Profil" className="profile-avatar" />
        </div>

        {!editMode ? (
          <h1>
            {profile.firstName} {profile.lastName}
          </h1>
        ) : (
          <div className="name-edit">
            <input
              value={profile.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="Prénom"
            />

            <input
              value={profile.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Nom"
            />
          </div>
        )}

        <div className="profile-badge">
          <ShieldCheck size={18} />
          {profile.badge}
        </div>

        <div className="profile-divider" />

        <div className="stats-row">
          <div className="stat">
            <Mountain className="stat-icon" />
            <strong>{profile.totalKm.toLocaleString("fr-FR")} km</strong>
            <small>total</small>
          </div>

          <div className="stat-border" />

          <div className="stat">
            <Bike className="stat-icon" />
            <strong>{profile.rides}</strong>
            <small>rides</small>
          </div>

          <div className="stat-border" />

          <div className="stat">
            <Medal className="stat-icon" />
            <strong>{profile.badges}</strong>
            <small>badges</small>
          </div>
        </div>

        {!editMode ? (
          <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
            <Pencil size={20} />
            Modifier le profil
          </button>
        ) : (
          <div className="profile-actions">
            <button className="save-btn" onClick={saveProfile}>
              <Save size={19} />
              Enregistrer
            </button>

            <button
              className="cancel-btn"
              onClick={() => {
                setEditMode(false);
                getProfile();
              }}
            >
              <X size={19} />
              Annuler
            </button>
          </div>
        )}
      </section>

      <section className="equipment-panel">
        <div className="panel-header">
          <div>
            <h2>Mon Équipement</h2>
            <div className="title-line" />
          </div>

          <button className="more-btn">
            <MoreHorizontal size={26} />
          </button>
        </div>

        <div className="bike-block">
          <img src={profile.bikeImageUrl} alt="Vélo" className="bike-image" />

          {!editMode ? (
            <h3>
              {profile.bikeName} — {profile.bikeType}
            </h3>
          ) : (
            <div className="bike-edit">
              <input
                value={profile.bikeName}
                onChange={(e) => handleChange("bikeName", e.target.value)}
                placeholder="Nom du vélo"
              />

              <input
                value={profile.bikeType}
                onChange={(e) => handleChange("bikeType", e.target.value)}
                placeholder="Type du vélo"
              />

              <input
                value={profile.bikeImageUrl}
                onChange={(e) => handleChange("bikeImageUrl", e.target.value)}
                placeholder="URL image vélo"
              />
            </div>
          )}
        </div>

        <div className="equipment-divider" />

        <h3 className="tires-title">
          <CircleDot size={26} />
          Mes pneus Michelin
        </h3>

        <div className="tires-grid">
          {profile.tires.map((tire, index) => (
            <article className="tire-card" key={tire.id || index}>
              <div className="tire-image-wrapper">
                {tire.imageUrl ? (
                  <img
                    src={tire.imageUrl}
                    alt={tire.model}
                    className="tire-image"
                  />
                ) : (
                  <div className="tire-fallback">
                    <CircleDot size={82} />
                  </div>
                )}
              </div>

              {!editMode ? (
                <>
                  <p className="tire-brand">{tire.brand}</p>
                  <h4>{tire.model}</h4>
                  <p className="tire-size">{tire.size}</p>

                  <div className="tire-separator" />

                  <p className="usage-label">Utilisation</p>
                  <strong className="usage-value">
                    {Number(tire.usageKm || 0).toLocaleString("fr-FR")} km
                  </strong>

                  <div className="stars">{renderStars(tire.rating)}</div>
                </>
              ) : (
                <div className="tire-edit">
                  <input
                    value={tire.brand}
                    onChange={(e) =>
                      handleTireChange(index, "brand", e.target.value)
                    }
                    placeholder="Marque"
                  />

                  <input
                    value={tire.model}
                    onChange={(e) =>
                      handleTireChange(index, "model", e.target.value)
                    }
                    placeholder="Modèle"
                  />

                  <input
                    value={tire.size}
                    onChange={(e) =>
                      handleTireChange(index, "size", e.target.value)
                    }
                    placeholder="Taille"
                  />

                  <input
                    value={tire.imageUrl}
                    onChange={(e) =>
                      handleTireChange(index, "imageUrl", e.target.value)
                    }
                    placeholder="URL image pneu"
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="favorite-usages">
          <h3>Mes usages favoris</h3>

          <div className="usage-tags">
            <span>
              <Route size={16} />
              Route
            </span>

            <span>
              <Infinity size={16} />
              Longue distance
            </span>

            <span>
              <Zap size={16} />
              Performances
            </span>

            <span>
              <Sun size={16} />
              Temps sec
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}