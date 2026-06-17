import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Bike,
  Mountain,
  Route,
  AlertTriangle,
  ArrowRight,
  CircleDot,
  Flame,
  Repeat,
  Zap,
  Crown,
} from "lucide-react";
import { getUser, progressApi, activitiesApi } from "../services/api";
import "../styles/ProgressPage.css";

const DAY_LABELS = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim" };

const STATUS_TEXT = {
  ok: "Pneu en bon état",
  monitor: "Pensez à surveiller l'usure",
  replace_soon: "Remplacement recommandé bientôt",
};

const BADGES = [
  { id: "km100", label: "100 km", icon: Flame, check: (s) => s.total_km >= 100,
    getProgress: (s) => ({ current: Math.min(s.total_km, 100), goal: 100, unit: "km" }) },
  { id: "km500", label: "500 km", icon: Mountain, check: (s) => s.total_km >= 500,
    getProgress: (s) => ({ current: Math.min(s.total_km, 500), goal: 500, unit: "km" }) },
  { id: "km1000", label: "1000 km", icon: Crown, check: (s) => s.total_km >= 1000,
    getProgress: (s) => ({ current: Math.min(s.total_km, 1000), goal: 1000, unit: "km" }) },
  { id: "rides10", label: "10 sorties", icon: Repeat, check: (s) => s.total_rides >= 10,
    getProgress: (s) => ({ current: Math.min(s.total_rides, 10), goal: 10, unit: "sorties" }) },
  { id: "rides50", label: "50 sorties", icon: Zap, check: (s) => s.total_rides >= 50,
    getProgress: (s) => ({ current: Math.min(s.total_rides, 50), goal: 50, unit: "sorties" }) },
];

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  return monday;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(Boolean(user?.id));
  const [summary, setSummary] = useState(null);
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [tyreWear, setTyreWear] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    Promise.allSettled([
      progressApi.summary(),
      progressApi.weekly(),
      progressApi.tyreWear(),
      activitiesApi.list({ user_id: user.id, limit: 50 }),
    ]).then(([summaryRes, weeklyRes, tyreRes, activitiesRes]) => {
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (weeklyRes.status === "fulfilled") setWeeklyDays(weeklyRes.value.data.days || []);
      if (tyreRes.status === "fulfilled") setTyreWear(tyreRes.value.data.items || []);
      if (activitiesRes.status === "fulfilled") {
        setActivities(activitiesRes.value.data.items || []);
      }
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) {
    return <p className="progress-loading">Chargement...</p>;
  }

  const weekStart = getWeekStart();
  const weeklyRides = activities.filter(
    (activity) => activity.status === "completed" && new Date(activity.completed_at) >= weekStart
  );
  const weeklyElevation = weeklyRides.reduce((sum, ride) => sum + (ride.elevation_m || 0), 0);

  const maxDayValue = Math.max(...weeklyDays.map((d) => d.distance_km || 0), 10);
  const axisMax = Math.ceil(maxDayValue / 10) * 10 || 10;
  const yAxisTicks = [6, 5, 4, 3, 2, 1, 0].map((i) => Math.round((axisMax / 6) * i));
  const totalWeekKm = weeklyDays.reduce((sum, d) => sum + (d.distance_km || 0), 0);

  return (
    <section className="progress-content">
        <header className="progress-header">
          <h1>Mes Progrès</h1>

          <div className="period-button">
            <CalendarDays size={20} />
            7 derniers jours
          </div>
        </header>

        <section className="progress-stats">
          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Route size={38} />
            </div>

            <div>
              <strong>{summary?.weekly_km ?? 0}</strong>
              <span>km cette semaine</span>
            </div>

            <div className="mini-line" />
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Bike size={38} />
            </div>

            <div>
              <strong>{weeklyRides.length}</strong>
              <span>rides</span>
            </div>

            <div className="mini-line" />
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Mountain size={38} />
            </div>

            <div>
              <strong>{weeklyElevation.toLocaleString("fr-FR")}</strong>
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
                Total : <strong>{Math.round(totalWeekKm)} km</strong>
              </span>
            </div>

            <div className="chart-area">
              <div className="y-axis">
                {yAxisTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              <div className="bars-area">
                {weeklyDays.map((day) => {
                  const barHeight = Math.min(((day.distance_km || 0) / axisMax) * 100, 100);

                  return (
                    <div className="bar-column" key={day.day}>
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: `${barHeight}%` }}
                          title={`${day.distance_km} km`}
                        />
                      </div>

                      <span>{DAY_LABELS[day.day] || day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="chart-period">7 derniers jours</p>
          </article>

          <article className="tire-progress-card">
            <div className="tire-progress-header">
              <h2>Mes Pneus</h2>
            </div>

            {tyreWear.length === 0 ? (
              <p className="remaining-text">
                Ajoute un pneu Michelin dans ton profil pour suivre son usure.
              </p>
            ) : (
              <div className="tyre-list">
                {tyreWear.map((tyre, i) => {
                  const pct = tyre.wear_percent;
                  const barColor = pct >= 80 ? "#ff6b6b" : pct >= 50 ? "#ffa500" : "#ffe600";
                  return (
                    <div key={i} className="tyre-row">
                      <div className="tyre-row-icon">
                        <CircleDot size={28} color="#ffe600" />
                      </div>
                      <div className="tyre-row-info">
                        <div className="tyre-row-header">
                          <strong>{tyre.tyre_name}</strong>
                          <span className={`tyre-status-badge tyre-status-${tyre.replacement_status}`}>
                            {tyre.replacement_status !== "ok" && <AlertTriangle size={11} />}
                            {STATUS_TEXT[tyre.replacement_status]}
                          </span>
                        </div>
                        <div className="tyre-wear-bar-track">
                          <div
                            className="tyre-wear-bar-fill"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                        <div className="tyre-row-km">
                          <span>{tyre.distance_done_km} km parcourus</span>
                          <span>{pct}% — vie : {tyre.estimated_lifespan_km} km</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="tyre-cta-btn" onClick={() => navigate("/recommandation")}>
              Voir les alternatives Michelin
              <ArrowRight size={18} />
            </button>
          </article>
        </section>

        <section className="badges-card">
          <div className="section-title">
            <h2>Badges &amp; Récompenses</h2>
            <span />
          </div>

          <div className="badges-grid">
            {BADGES.map((badge) => {
              const earned = summary ? badge.check(summary) : false;
              const progress = summary ? badge.getProgress(summary) : null;
              const Icon = badge.icon;

              return (
                <div className={`badge-item ${earned ? "earned" : "locked"}`} key={badge.id}>
                  <div className="badge-icon">
                    <Icon size={26} />
                  </div>
                  <strong>{badge.label}</strong>
                  {earned ? (
                    <span className="badge-unlocked">Débloqué ✓</span>
                  ) : progress ? (
                    <span className="badge-progress">
                      {progress.unit === "km"
                        ? `${progress.current.toLocaleString("fr-FR")} / ${progress.goal} km`
                        : `${progress.current} / ${progress.goal} ${progress.unit}`}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
    </section>
  );
}
