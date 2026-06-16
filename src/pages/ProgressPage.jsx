import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import {
  Home,
  Users,
  Activity,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bike,
  Mountain,
  CalendarDays,
  ChevronDown,
  Route,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import "../styles/ProgressPage.css";

const API_URL = "http://localhost:5000/api/progress";

const defaultProgressData = {
  user: {
    firstName: "Youssef",
    lastName: "M.",
    level: 28,
    avatarUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300",
  },
  period: "30 derniers jours",
  stats: {
    kmThisWeek: 187,
    rides: 4,
    elevation: 1240,
  },
  dailyKm: [
    { label: "21 avr.", value: 24 },
    { label: "", value: 4 },
    { label: "", value: 13 },
    { label: "", value: 26 },
    { label: "", value: 22 },
    { label: "", value: 0 },
    { label: "", value: 6 },
    { label: "28 avr.", value: 30 },
    { label: "", value: 36 },
    { label: "", value: 7 },
    { label: "", value: 12 },
    { label: "", value: 0 },
    { label: "", value: 24 },
    { label: "", value: 7 },
    { label: "5 mai", value: 2 },
    { label: "", value: 54 },
    { label: "", value: 19 },
    { label: "", value: 29 },
    { label: "", value: 5 },
    { label: "", value: 38 },
    { label: "", value: 15 },
    { label: "", value: 11 },
    { label: "12 mai", value: 20 },
    { label: "", value: 29 },
    { label: "", value: 45 },
    { label: "", value: 30 },
    { label: "", value: 2 },
    { label: "", value: 5 },
    { label: "", value: 19 },
    { label: "", value: 28 },
    { label: "19 mai", value: 25 },
    { label: "", value: 5 },
    { label: "", value: 30 },
  ],
  tire: {
    name: "MICHELIN POWER CUP",
    imageUrl:
      "https://images.unsplash.com/photo-1610647752706-3bb12232b3a8?q=80&w=900",
    usedKm: 2340,
    maxKm: 4000,
    wearPercent: 58,
    alertText: "Pensez au remplacement bientôt",
  },
};

export default function ProgressPage() {
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState(defaultProgressData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgressData();
  }, []);

  const getProgressData = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Backend non disponible");
      }

      const data = await response.json();

      setProgressData({
        user: {
          firstName: data.user?.firstName || defaultProgressData.user.firstName,
          lastName: data.user?.lastName || defaultProgressData.user.lastName,
          level: data.user?.level ?? defaultProgressData.user.level,
          avatarUrl: data.user?.avatarUrl || defaultProgressData.user.avatarUrl,
        },
        period: data.period || defaultProgressData.period,
        stats: {
          kmThisWeek:
            data.stats?.kmThisWeek ?? defaultProgressData.stats.kmThisWeek,
          rides: data.stats?.rides ?? defaultProgressData.stats.rides,
          elevation:
            data.stats?.elevation ?? defaultProgressData.stats.elevation,
        },
        dailyKm: data.dailyKm?.length
          ? data.dailyKm
          : defaultProgressData.dailyKm,
        tire: {
          name: data.tire?.name || defaultProgressData.tire.name,
          imageUrl: data.tire?.imageUrl || defaultProgressData.tire.imageUrl,
          usedKm: data.tire?.usedKm ?? defaultProgressData.tire.usedKm,
          maxKm: data.tire?.maxKm ?? defaultProgressData.tire.maxKm,
          wearPercent:
            data.tire?.wearPercent ?? defaultProgressData.tire.wearPercent,
          alertText: data.tire?.alertText || defaultProgressData.tire.alertText,
        },
      });
    } catch (error) {
      console.warn("Données temporaires utilisées :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalKm = progressData.dailyKm.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  if (loading) {
    return (
      <main className="progress-page">
        <p className="progress-loading">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="progress-page">
      <aside className="progress-sidebar">
        <div className="progress-logo">
          <span className="progress-logo-m">M</span>
          <span className="progress-logo-text">MICHELIN</span>
          <span className="progress-logo-subtitle">RIDING</span>
        </div>

        <nav className="progress-menu">
          <button onClick={() => navigate("/")}>
            <Home size={24} />
            Accueil
          </button>

          <button onClick={() => navigate("/communaute")}>
            <Users size={24} />
            Communauté
          </button>

          <button className="active">
            <BarChart3 size={24} />
            Activité
          </button>

          <button onClick={() => navigate("/profil")}>
            <User size={24} />
            Mon Profil
          </button>

          <button>
            <Settings size={24} />
            Paramètres
          </button>
        </nav>

        <div className="progress-user-box">
          <img src={progressData.user.avatarUrl} alt="Utilisateur" />

          <div>
            <strong>
              {progressData.user.firstName} {progressData.user.lastName}
            </strong>
            <span>Niveau {progressData.user.level}</span>
          </div>
        </div>

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

      <section className="progress-content">
        <header className="progress-header">
          <h1>Activité</h1>

          <button className="period-button">
            <CalendarDays size={20} />
            {progressData.period}
            <ChevronDown size={20} />
          </button>
        </header>

        <section className="progress-stats">
          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Route size={38} />
            </div>

            <div>
              <strong>{progressData.stats.kmThisWeek}</strong>
              <span>km cette semaine</span>
            </div>

            <div className="mini-line" />
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Bike size={38} />
            </div>

            <div>
              <strong>{progressData.stats.rides}</strong>
              <span>rides</span>
            </div>

            <div className="mini-line" />
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Mountain size={38} />
            </div>

            <div>
              <strong>
                {progressData.stats.elevation.toLocaleString("fr-FR")}
              </strong>
              <span>m dénivelé</span>
            </div>

            <div className="mini-line" />
          </article>
        </section>

        <section className="progress-main-grid">
          <article className="km-chart-card">
            <div className="chart-header">
              <h2>Kilomètres par jour</h2>
              <span>
                Total : <strong>{totalKm} km</strong>
              </span>
            </div>

            <div className="chart-area">
              <div className="y-axis">
                <span>60</span>
                <span>50</span>
                <span>40</span>
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              <div className="bars-area">
                {progressData.dailyKm.map((day, index) => {
                  const barHeight = Math.min(
                    (Number(day.value || 0) / 60) * 100,
                    100
                  );

                  return (
                    <div className="bar-column" key={index}>
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: `${barHeight}%` }}
                          title={`${day.value} km`}
                        />
                      </div>

                      <span>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="chart-period">{progressData.period}</p>
          </article>

          <article className="tire-progress-card">
            <div className="tire-progress-header">
              <h2>Mes Pneus</h2>
              <Settings size={24} />
            </div>

            <div className="tire-progress-content">
              <div className="tire-progress-image">
                <img
                  src={progressData.tire.imageUrl}
                  alt={progressData.tire.name}
                />
              </div>

              <div className="tire-progress-info">
                <h3>{progressData.tire.name}</h3>

                <div className="wear-circle">
                  <div
                    className="wear-circle-inner"
                    style={{
                      background: `conic-gradient(#FFE600 ${
                        progressData.tire.wearPercent * 3.6
                      }deg, #444 ${
                        progressData.tire.wearPercent * 3.6
                      }deg)`,
                    }}
                  >
                    <div>
                      <strong>{progressData.tire.usedKm}</strong>
                      <span>/ {progressData.tire.maxKm} km</span>
                    </div>
                  </div>
                </div>

                <div className="wear-text">
                  <strong>{progressData.tire.wearPercent}%</strong>
                  <span>d’usure</span>
                </div>

                <p className="tire-alert">
                  <AlertTriangle size={22} />
                  {progressData.tire.alertText}
                </p>

                <button>
                  Voir les alternatives Michelin
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}