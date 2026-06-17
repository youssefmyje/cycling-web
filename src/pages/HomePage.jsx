import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gauge,
  CalendarDays,
  Mountain,
  Medal,
  ArrowRight,
  Bike,
  CircleDot,
  Route,
  ChevronLeft,
  ChevronRight,
  Navigation,
  TreePine,
  Building2,
  Layers,
} from "lucide-react";
import {
  getUser,
  profileApi,
  progressApi,
  activitiesApi,
  challengesApi,
  recommendationsApi,
} from "../services/api";
import "../styles/HomePage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const TERRAIN_ICON = { route: Navigation, gravel: Layers, mtb: TreePine, urban: Building2 };

function StarRating({ value }) {
  if (!value) return <span style={{ color: "#555" }}>—</span>;
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star ${i <= value ? "filled" : "empty"}`}>★</span>
      ))}
    </span>
  );
}

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
  const [challenges, setChallenges] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

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
        setChallenges(challengesRes.value.data.items || []);
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

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyRides = completedRides.filter(
    (r) => new Date(r.started_at) >= startOfWeek
  ).length;

  const weeklyElevation = completedRides
    .filter((r) => new Date(r.started_at) >= startOfWeek)
    .reduce((sum, r) => sum + (r.elevation_m || 0), 0);

  const getChallengeStats = (goalType) => {
    switch (goalType) {
      case "rides":
      case "rides_count": return { value: weeklyRides,    unit: "sorties" };
      case "elevation_m":
      case "elevation":   return { value: weeklyElevation, unit: "m" };
      default:            return { value: weeklyKm,        unit: "km" };
    }
  };

  const scrollToSlide = (index) => {
    const el = carouselRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, challenges.length - 1));
    el.scrollTo({ left: el.offsetWidth * clamped, behavior: "smooth" });
    setActiveSlide(clamped);
  };

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveSlide(index);
  };

  return (
    <section className="home-content">

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
            <div className="section-title-recommendation">
              <h2>Michelin vous recommande</h2>
              <span />
            </div>

            <div className="recommendation-content">
              <div className={`tire-visual-large ${recommendation?.primary_tyre?.pic1 ? "has-image" : ""}`}>
                {recommendation?.primary_tyre?.pic1 ? (
                  <img src="/pneus/powercup2.png" alt={recommendation.primary_tyre.model} />
                ) : (
                  <CircleDot size={88} color="#FFE600" />
                )}
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

                <div className={"recommendation-info-buttons"}>
                  {recommendation?.primary_tyre?.id && (
                      <button
                          className="reco-product-btn"
                          onClick={() => navigate(`/catalogue/${recommendation.primary_tyre.id}`)}
                      >
                        <span>Voir la fiche produit</span>
                        <ArrowRight size={18} />
                      </button>
                  )}
                  <button onClick={() => navigate("/recommandation")}>
                    <span>{recommendation ? "Refaire le test" : "Trouver mon pneu"}</span>
                    <ArrowRight size={22} />
                  </button>
                </div>


              </div>
            </div>
          </article>

          <article className="challenge-card">
            <div className="challenge-card-header">
              <div className="section-title">
                <h2>Challenge de la semaine</h2>
                <span />
              </div>

              {challenges.length > 1 && (
                <div className="carousel-arrows">
                  <button
                    className="carousel-arrow-btn"
                    onClick={() => scrollToSlide(activeSlide - 1)}
                    disabled={activeSlide === 0}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="carousel-arrow-btn"
                    onClick={() => scrollToSlide(activeSlide + 1)}
                    disabled={activeSlide === challenges.length - 1}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {challenges.length === 0 ? (
              <p className="remaining-text">Aucun challenge actif pour le moment.</p>
            ) : (
              <>
                <div
                  className="challenge-carousel"
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                >
                  {challenges.map((c) => {
                    const goal = c.goal_value ?? 0;
                    const { value, unit } = getChallengeStats(c.goal_type);
                    const progress = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
                    return (
                      <div className="challenge-slide" key={c.id}>
                        <div className="challenge-content">
                          <div className="challenge-icon">
                            <Route size={70} />
                          </div>
                          <div>
                            <h3>{c.title}</h3>
                            <p>{c.description}</p>
                          </div>
                        </div>

                        <div className="challenge-progress-text">
                          <strong>{value}</strong>
                          <span>/ {goal} {unit}</span>
                        </div>

                        <div className="progress-bar">
                          <div style={{ width: `${progress}%` }} />
                        </div>

                      </div>
                    );
                  })}
                </div>

                {challenges.length > 1 && (
                  <div className="carousel-dots">
                    {challenges.map((_, i) => (
                      <button
                        key={i}
                        className={`carousel-dot${i === activeSlide ? " active" : ""}`}
                        onClick={() => scrollToSlide(i)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </article>

        <section className="recent-rides-card">
          <div className="section-title">
            <h2>Mes Rides récents</h2>
            <span />
          </div>

          <div className="rides-table">
            <div className="rides-head">
              <span></span>
              <span>Date ↓</span>
              <span>Distance</span>
              <span>Durée</span>
              <span>Terrain</span>
              <span>Pneu utilisé</span>
              <span>Note</span>
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
                  <span className="ride-bike-icon">
                      <Bike size={20} />
                    </span>
                  <div className="date-cell">
                    {formatDate(ride.started_at)}
                  </div>

                  <span>{ride.distance_km ?? "—"} km</span>
                  <span>{formatDuration(ride.duration_seconds)}</span>

                  <span className="terrain-cell">
                    {(() => { const Icon = TERRAIN_ICON[ride.type] || Bike; return <Icon size={16} className="terrain-icon" />; })()}
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
                  <StarRating value={ride.rating} />
                </div>
              );
            })}
          </div>
        </section>
    </section>
  );
}
