import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gauge,
  CalendarDays,
  Mountain,
  Medal,
  ArrowRight,
  ChevronDown,
  Bike,
  CircleDot,
  Route,
  TrendingUp,
  LogOut,
} from "lucide-react";
import {
  getUser,
  logout,
  profileApi,
  progressApi,
  activitiesApi,
  challengesApi,
  recommendationsApi,
} from "../services/api";
import "../styles/HomePage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };

function formatDuration(seconds) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}` : `${minutes} min`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = getUser();
  const menuRef = useRef(null);

  const [loading, setLoading] = useState(Boolean(user?.id));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    Promise.allSettled([
      profileApi.get(user.id),
      progressApi.summary(),
      activitiesApi.list({ user_id: user.id, limit: 50 }),
      profileApi.getBikes(user.id),
      challengesApi.list(),
    ]).then(([profileRes, summaryRes, activitiesRes, bikesRes, challengesRes]) => {
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (activitiesRes.status === "fulfilled") {
        setActivities(activitiesRes.value.data.items || []);
      }
      if (bikesRes.status === "fulfilled") setBikes(bikesRes.value.data.items || []);
      if (challengesRes.status === "fulfilled") {
        const items = challengesRes.value.data.items || [];
        setChallenge(items.find((item) => item.joined) || items[0] || null);
      }
      setLoading(false);
    });

    const cachedRecoId = localStorage.getItem("lastRecommendationId");
    if (cachedRecoId) {
      recommendationsApi
        .get(cachedRecoId)
        .then((res) => setRecommendation(res.data))
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  if (loading) {
    return <p className="loading-text">Chargement...</p>;
  }

  const completedRides = activities
    .filter((activity) => activity.status === "completed")
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

  const now = new Date();
  const monthlyRides = completedRides.filter((ride) => {
    const date = new Date(ride.completed_at || ride.started_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const totalElevation = completedRides.reduce(
    (sum, ride) => sum + (ride.elevation_m || 0),
    0
  );

  const tyreByBikeId = new Map(
    bikes.map((bike) => [bike.id, bike.mounted_tyres?.[0]])
  );

  const recentRides = completedRides.slice(0, 5);

  const weeklyKm = summary?.weekly_km ?? 0;
  const challengeGoal = challenge?.goal_value ?? 0;
  const challengeProgress = challenge
    ? Math.min((weeklyKm / challengeGoal) * 100, 100)
    : 0;
  const challengeRemaining = challenge ? Math.max(challengeGoal - weeklyKm, 0) : 0;

  return (
    <section className="home-content">
        <header className="home-header">
          <h1>Accueil</h1>

          <div
            className="header-user"
            ref={menuRef}
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <img
              src={
                profile?.avatar_url ||
                "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
              }
              alt="Utilisateur"
            />
            <ChevronDown size={22} />

            {showUserMenu && (
              <div className="user-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            )}
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
                {(profile?.stats?.total_km ?? 0).toLocaleString("fr-FR")} km
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <CalendarDays size={42} />
            </div>

            <div>
              <p>Rides ce mois</p>
              <strong>{monthlyRides}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <Mountain size={42} />
            </div>

            <div>
              <p>Dénivelé total</p>
              <strong>{totalElevation.toLocaleString("fr-FR")} m</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon-circle">
              <Medal size={42} />
            </div>

            <div>
              <p>Badges</p>
              <strong>{summary?.badges_count ?? 0}</strong>
            </div>
          </article>
        </section>

        <article className="recommendation-card">
            <div className="section-title">
              <h2>Michelin vous recommande</h2>
              <span />
            </div>

            <div className="recommendation-content">
              <div className="tire-visual-large">
                <CircleDot size={88} color="#FFE600" />
              </div>

              <div className="recommendation-info">
                <div className="michelin-product-logo">
                  <span>MICHELIN</span>
                  <strong>
                    {recommendation
                        ? recommendation.primary_tyre.model
                        : "Trouve ton pneu idéal"}
                  </strong>
                </div>

                <p>
                  {recommendation
                      ? recommendation.primary_tyre.reasons?.[0]
                      : "Réponds à 5 questions sur ta pratique pour découvrir le pneu Michelin fait pour toi."}
                </p>

                <button onClick={() => navigate("/recommandation")}>
                  <span>{recommendation ? "Refaire le test" : "Trouver mon pneu"}</span>
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

            {challenge ? (
              <>
                <div className="challenge-content">
                  <div className="challenge-icon">
                    <Route size={70} />
                  </div>

                  <div>
                    <h3>{challenge.title}</h3>
                    <p>{challenge.description}</p>
                  </div>
                </div>

                <div className="challenge-progress-text">
                  <strong>{weeklyKm}</strong>
                  <span>/ {challengeGoal} km</span>
                </div>

                <div className="progress-bar">
                  <div style={{ width: `${challengeProgress}%` }} />
                </div>

                <p className="remaining-text">
                  {challenge.joined
                    ? `${challengeRemaining} km restants`
                    : "Pas encore rejoint"}
                </p>
              </>
            ) : (
              <p className="remaining-text">Aucun challenge actif pour le moment.</p>
            )}
        </article>

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
            </div>

            {recentRides.length === 0 && (
              <p className="remaining-text">
                Pas encore de sortie. Lance-toi avec le bouton « Nouvelle sortie ».
              </p>
            )}

            {recentRides.map((ride) => {
              const tyre = tyreByBikeId.get(ride.bike_id);

              return (
                <div
                  className="rides-row rides-row-clickable"
                  key={ride.id}
                  onClick={() => navigate(`/activites/${ride.id}`)}
                >
                  <div className="date-cell">
                    <span className="ride-bike-icon">
                      <Bike size={20} />
                    </span>
                    {formatDate(ride.started_at)}
                  </div>

                  <span>{ride.distance_km ?? "—"} km</span>
                  <span>{formatDuration(ride.duration_seconds)}</span>

                  <span className="terrain-cell">
                    <TrendingUp size={28} />
                    {TYPE_LABELS[ride.type] || ride.type}
                  </span>

                  <span className="tire-used">
                    {tyre ? (
                      <>
                        MICHELIN&nbsp;<strong>{tyre.model}</strong>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
    </section>
  );
}
