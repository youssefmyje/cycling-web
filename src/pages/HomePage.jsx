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
  Gauge,
  CalendarDays,
  Mountain,
  Medal,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  Bike,
  Star,
  Route,
  TrendingUp,
} from "lucide-react";
import "../styles/HomePage.css";

const API_URL = "http://localhost:5000/api/home";

const defaultHomeData = {
  user: {
    firstName: "Youssef",
    lastName: "M.",
    avatarUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300",
  },
  stats: {
    totalKm: 1240,
    ridesThisMonth: 12,
    totalElevation: 4200,
    badges: 8,
  },
  recommendation: {
    title: "Michelin vous recommande",
    productName: "Power Cup 2",
    description: "Votre profil Route longue distance",
    imageUrl:
      "https://images.unsplash.com/photo-1610647752706-3bb12232b3a8?q=80&w=900",
  },
  weeklyChallenge: {
    title: "Parcours Endurance",
    description: "Parcourez 100 km cette semaine",
    currentKm: 78,
    targetKm: 100,
    remainingKm: 22,
  },
  recentRides: [
    {
      id: 1,
      date: "25 mai 2024",
      distance: "132 km",
      duration: "4h 32",
      terrain: "Montagneux",
      tireUsed: "POWER CUP 2",
      rating: 5,
    },
    {
      id: 2,
      date: "22 mai 2024",
      distance: "86 km",
      duration: "2h 58",
      terrain: "Vallonné",
      tireUsed: "POWER CUP 2",
      rating: 4,
    },
    {
      id: 3,
      date: "19 mai 2024",
      distance: "54 km",
      duration: "1h 45",
      terrain: "Plat",
      tireUsed: "POWER ROAD",
      rating: 4,
    },
  ],
};

export default function HomePage() {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(defaultHomeData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeData();
  }, []);

  const getHomeData = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Backend non disponible");
      }

      const data = await response.json();

      setHomeData({
        user: {
          firstName: data.user?.firstName || defaultHomeData.user.firstName,
          lastName: data.user?.lastName || defaultHomeData.user.lastName,
          avatarUrl: data.user?.avatarUrl || defaultHomeData.user.avatarUrl,
        },
        stats: {
          totalKm: data.stats?.totalKm ?? defaultHomeData.stats.totalKm,
          ridesThisMonth:
            data.stats?.ridesThisMonth ??
            defaultHomeData.stats.ridesThisMonth,
          totalElevation:
            data.stats?.totalElevation ??
            defaultHomeData.stats.totalElevation,
          badges: data.stats?.badges ?? defaultHomeData.stats.badges,
        },
        recommendation: {
          title:
            data.recommendation?.title ||
            defaultHomeData.recommendation.title,
          productName:
            data.recommendation?.productName ||
            defaultHomeData.recommendation.productName,
          description:
            data.recommendation?.description ||
            defaultHomeData.recommendation.description,
          imageUrl:
            data.recommendation?.imageUrl ||
            defaultHomeData.recommendation.imageUrl,
        },
        weeklyChallenge: {
          title:
            data.weeklyChallenge?.title ||
            defaultHomeData.weeklyChallenge.title,
          description:
            data.weeklyChallenge?.description ||
            defaultHomeData.weeklyChallenge.description,
          currentKm:
            data.weeklyChallenge?.currentKm ??
            defaultHomeData.weeklyChallenge.currentKm,
          targetKm:
            data.weeklyChallenge?.targetKm ??
            defaultHomeData.weeklyChallenge.targetKm,
          remainingKm:
            data.weeklyChallenge?.remainingKm ??
            defaultHomeData.weeklyChallenge.remainingKm,
        },
        recentRides: data.recentRides?.length
          ? data.recentRides
          : defaultHomeData.recentRides,
      });
    } catch (error) {
      console.warn("Données temporaires utilisées :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.round(Number(rating) || 0);

    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={20}
        fill={index < fullStars ? "#FFE600" : "transparent"}
        color={index < fullStars ? "#FFE600" : "#777"}
      />
    ));
  };

  const progressPercent =
    (homeData.weeklyChallenge.currentKm /
      homeData.weeklyChallenge.targetKm) *
    100;

  if (loading) {
    return (
      <main className="home-page">
        <p className="loading-text">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="home-page">
      <aside className="home-sidebar">
        <div className="home-logo">
          <span className="home-logo-m">M</span>
          <span className="home-logo-text">MICHELIN</span>
          <span className="home-logo-subtitle">RIDING</span>
        </div>

        <nav className="home-menu">
          <button className="active">
            <Home size={24} />
            Accueil
          </button>

          <button onClick={() => navigate("/communaute")}>
            <Users size={24} />
            Communauté
          </button>

          <button onClick={() => navigate("/progres")}>
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

        <div className="bibendum-box">
          <Bike size={110} />
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

      <section className="home-content">
        <header className="home-header">
          <h1>Accueil</h1>

          <div className="header-user">
            <img src={homeData.user.avatarUrl} alt="Utilisateur" />
            <ChevronDown size={22} />
          </div>
        </header>

        <section className="stats-cards">
          <article className="stat-card">
            <div className="stat-icon-circle">
              <Gauge size={42} />
            </div>

            <div>
              <p>Total km</p>
              <strong>
                {homeData.stats.totalKm.toLocaleString("fr-FR")} km
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <CalendarDays size={42} />
            </div>

            <div>
              <p>Rides ce mois</p>
              <strong>{homeData.stats.ridesThisMonth}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <Mountain size={42} />
            </div>

            <div>
              <p>Dénivelé total</p>
              <strong>
                {homeData.stats.totalElevation.toLocaleString("fr-FR")} m
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <Medal size={42} />
            </div>

            <div>
              <p>Badges</p>
              <strong>{homeData.stats.badges}</strong>
            </div>
          </article>
        </section>

        <section className="main-grid">
          <article className="recommendation-card">
            <div className="section-title">
              <h2>{homeData.recommendation.title}</h2>
              <span />
            </div>

            <div className="recommendation-content">
              <div className="tire-visual-large">
                <img
                  src={homeData.recommendation.imageUrl}
                  alt={homeData.recommendation.productName}
                />
              </div>

              <div className="recommendation-info">
                <div className="michelin-product-logo">
                  <span>MICHELIN</span>
                  <strong>
                    POWER
                    <br />
                    CUP 2
                  </strong>
                </div>

                <p>
                  {homeData.recommendation.description}
                  <br />
                  <span>→ {homeData.recommendation.productName}</span>
                </p>

                <button>
                  <span>Voir & Acheter</span>
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </article>

          <article className="challenge-card">
            <div className="section-title">
              <h2>Challenge de la semaine</h2>
              <span />
            </div>

            <div className="challenge-content">
              <div className="challenge-icon">
                <Route size={70} />
              </div>

              <div>
                <h3>{homeData.weeklyChallenge.title}</h3>
                <p>{homeData.weeklyChallenge.description}</p>
              </div>
            </div>

            <div className="challenge-progress-text">
              <strong>{homeData.weeklyChallenge.currentKm}</strong>
              <span>/ {homeData.weeklyChallenge.targetKm} km</span>
            </div>

            <div className="progress-bar">
              <div style={{ width: `${progressPercent}%` }} />
            </div>

            <p className="remaining-text">
              {homeData.weeklyChallenge.remainingKm} km restants
            </p>
          </article>
        </section>

        <section className="recent-rides-card">
          <div className="section-title">
            <h2>Rides récents</h2>
            <span />
          </div>

          <div className="rides-table">
            <div className="rides-head">
              <span>Date ↓</span>
              <span>Distance</span>
              <span>Durée</span>
              <span>Terrain</span>
              <span>Pneu utilisé</span>
              <span>Rating</span>
            </div>

            {homeData.recentRides.map((ride) => (
              <div className="rides-row" key={ride.id}>
                <div className="date-cell">
                  <span className="ride-bike-icon">
                    <Bike size={20} />
                  </span>
                  {ride.date}
                </div>

                <span>{ride.distance}</span>
                <span>{ride.duration}</span>

                <span className="terrain-cell">
                  <TrendingUp size={28} />
                  {ride.terrain}
                </span>

                <span className="tire-used">
                  MICHELIN&nbsp;
                  <strong>{ride.tireUsed}</strong>
                </span>

                <span className="rating-cell">{renderStars(ride.rating)}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}