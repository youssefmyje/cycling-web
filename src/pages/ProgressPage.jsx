import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Bike,
  Mountain,
  Route,
  AlertTriangle,
  ArrowRight,
  Flame,
  Repeat,
  Zap,
  Crown,
  ChevronDown,
  TrendingUp, Navigation, Layers, TreePine, Building2,
  Copy, Check, Lock, ChevronUp,
} from "lucide-react";
import { getUser, progressApi, activitiesApi, profileApi } from "../services/api";
import "../styles/ProgressPage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const TERRAIN_ICON = { route: Navigation, gravel: Layers, mtb: TreePine, urban: Building2 };

const PERIODS = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "3 derniers mois",
};

const STATUS_TEXT = {
  ok: "Pneu en bon état",
  monitor: "Pensez à surveiller l'usure",
  replace_soon: "Remplacement recommandé bientôt",
};

const BADGES = [
  {
    id: "km100", label: "100 km", icon: Flame,
    check: (s) => s.total_km >= 100,
    getProgress: (s) => ({ current: Math.min(s.total_km, 100), goal: 100, unit: "km" }),
    promo: { code: "MICH100KM", desc: "−10% sur ton prochain pneu Michelin", expires: "31/12/2026" },
  },
  {
    id: "km500", label: "500 km", icon: Mountain,
    check: (s) => s.total_km >= 500,
    getProgress: (s) => ({ current: Math.min(s.total_km, 500), goal: 500, unit: "km" }),
    promo: { code: "RIDER500", desc: "−15% sur les accessoires vélo", expires: "31/12/2026" },
  },
  {
    id: "km1000", label: "1 000 km", icon: Crown,
    check: (s) => s.total_km >= 1000,
    getProgress: (s) => ({ current: Math.min(s.total_km, 1000), goal: 1000, unit: "km" }),
    promo: { code: "LEGEND1K", desc: "Livraison offerte + −20% sur toute la gamme Racing", expires: "31/12/2026" },
  },
  {
    id: "rides10", label: "10 sorties", icon: Repeat,
    check: (s) => s.total_rides >= 10,
    getProgress: (s) => ({ current: Math.min(s.total_rides, 10), goal: 10, unit: "sorties" }),
    promo: { code: "RIDES10GO", desc: "−5% dès 50 € d'achat sur michelin.fr", expires: "31/12/2026" },
  },
  {
    id: "rides50", label: "50 sorties", icon: Zap,
    check: (s) => s.total_rides >= 50,
    getProgress: (s) => ({ current: Math.min(s.total_rides, 50), goal: 50, unit: "sorties" }),
    promo: { code: "FIFTY50RIDE", desc: "−25% sur les pneus Performance & Racing", expires: "31/12/2026" },
  },
];

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
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}` : `${m} min`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

function buildChartDays(rides, period) {
  if (period === "90d") {
    const weeks = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      d.setHours(0, 0, 0, 0);
      weeks.push({ start: new Date(d), label: `${d.getDate()}/${d.getMonth() + 1}`, km: 0 });
    }
    rides.forEach((a) => {
      const d = new Date(a.completed_at || a.started_at);
      for (let j = weeks.length - 1; j >= 0; j--) {
        if (d >= weeks[j].start) { weeks[j].km += a.distance_km || 0; break; }
      }
    });
    return weeks.map((w) => ({ day: w.label, distance_km: Math.round(w.km * 10) / 10 }));
  }

  const n = period === "30d" ? 30 : 7;
  const slots = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const label = n === 7
      ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]
      : i % 5 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : "";
    slots.push({ ts: d.getTime(), label, km: 0 });
  }
  rides.forEach((a) => {
    const d = new Date(a.completed_at || a.started_at);
    d.setHours(0, 0, 0, 0);
    const slot = slots.find((s) => s.ts === d.getTime());
    if (slot) slot.km += a.distance_km || 0;
  });
  return slots.map((s) => ({ day: s.label, distance_km: Math.round(s.km * 10) / 10 }));
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(Boolean(user?.id));
  const [summary, setSummary] = useState(null);
  const [tyreWear, setTyreWear] = useState([]);
  const [activities, setActivities] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [period, setPeriod] = useState("7d");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hiddenPromos, setHiddenPromos] = useState({});

  const togglePromo = (id) => setHiddenPromos((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!user?.id) return;

    Promise.allSettled([
      progressApi.summary(),
      progressApi.tyreWear(),
      activitiesApi.list({ user_id: user.id, limit: 200 }),
      profileApi.getBikes(user.id),
    ]).then(([summaryRes, tyreRes, activitiesRes, bikesRes]) => {
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (tyreRes.status === "fulfilled") setTyreWear(tyreRes.value.data.items || []);
      if (activitiesRes.status === "fulfilled") setActivities(activitiesRes.value.data.items || []);
      if (bikesRes.status === "fulfilled") setBikes(bikesRes.value.data.items || []);
      setLoading(false);
    });
  }, [user?.id]);

  const periodDays = { "7d": 7, "30d": 30, "90d": 90 }[period] || 7;

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [periodDays]);

  const periodRides = useMemo(
    () => activities.filter(
      (a) => a.status === "completed" && new Date(a.completed_at || a.started_at) >= cutoff
    ),
    [activities, cutoff]
  );

  const periodKm = useMemo(
    () => Math.round(periodRides.reduce((s, r) => s + (r.distance_km || 0), 0) * 10) / 10,
    [periodRides]
  );

  const periodElevation = useMemo(
    () => periodRides.reduce((s, r) => s + (r.elevation_m || 0), 0),
    [periodRides]
  );

  const chartDays = useMemo(() => buildChartDays(periodRides, period), [periodRides, period]);

  const maxDayValue = Math.max(...chartDays.map((d) => d.distance_km || 0), 10);
  const axisMax = Math.ceil(maxDayValue / 10) * 10 || 10;
  const yAxisTicks = [6, 5, 4, 3, 2, 1, 0].map((i) => Math.round((axisMax / 6) * i));

  if (loading) {
    return <p className="progress-loading">Chargement...</p>;
  }

  const tyreByBikeId = new Map(bikes.map((bike) => [bike.id, bike.mounted_tyres?.[0]]));

  const recentRides = periodRides
    .slice()
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 15);

  return (
    <section className="progress-content">
        <header className="progress-header">
          <h1>Mes Progrès</h1>

          <div className="period-selector">
            <button
              className="period-button"
              onClick={() => setShowPeriodMenu((v) => !v)}
            >
              <CalendarDays size={16} />
              {PERIODS[period]}
              <ChevronDown size={14} className={showPeriodMenu ? "chevron-up" : ""} />
            </button>
            {showPeriodMenu && (
              <div className="period-menu">
                {Object.entries(PERIODS).map(([key, label]) => (
                  <button
                    key={key}
                    className={period === key ? "active" : ""}
                    onClick={() => { setPeriod(key); setShowPeriodMenu(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <section className="progress-stats">
          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Route size={38} />
            </div>

            <div>
              <strong>{periodKm}</strong>
              <span>km sur la période</span>
            </div>
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Bike size={38} />
            </div>

            <div>
              <strong>{periodRides.length}</strong>
              <span>rides</span>
            </div>
          </article>

          <article className="progress-stat-card">
            <div className="progress-stat-icon">
              <Mountain size={38} />
            </div>

            <div>
              <strong>{periodElevation.toLocaleString("fr-FR")}</strong>
              <span>m dénivelé</span>
            </div>
          </article>
        </section>

        <section className="progress-main-grid">
          <article className="km-chart-card">
            <div className="chart-header">
              <h2>Km par jour </h2>
            </div>

            <div className="chart-area">
              <div className="y-axis">
                {yAxisTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              <div className="bars-area">
                {chartDays.map((day, i) => {
                  const barHeight = Math.min(((day.distance_km || 0) / axisMax) * 100, 100);

                  return (
                    <div className="bar-column" key={i}>
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: `${barHeight}%` }}
                          title={`${day.distance_km} km`}
                        />
                      </div>

                      <span>{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="chart-period">{PERIODS[period]}</p>
          </article>

          <article className="tire-progress-card">
            <div className="tire-progress-header">
              <h2>Mes Pneus </h2>
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
                    <div
                      key={i}
                      className={`tyre-row${tyre.catalogue_id ? " tyre-row-clickable" : ""}`}
                      onClick={() => tyre.catalogue_id && navigate(`/catalogue/${tyre.catalogue_id}`)}
                    >
                      <div className="tyre-row-icon">
                        <h1>{tyre.pic}</h1>
                        {(
                          <img
                            src={tyre.pic || tyre.pic1}
                            alt={tyre.tyre_name}
                            className="tyre-row-img"
                          />
                        )}
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

        <section className="progress-rides-card">
          <div className="section-title section-title-with-action">
            <div>
              <h2>Mes rides récents</h2>
              <span />
            </div>
            <button className="see-all-btn" onClick={() => navigate("/mes-rides")}>
              Voir tout →
            </button>
          </div>

          <div className="rides-table">
            <div className="rides-head">
              <span></span>
              <span>Date ↓</span>
              <span>Distance</span>
              <span>Durée</span>
              <span>Terrain</span>
              <span>Dénivelé</span>
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
              const TerrainIcon = TERRAIN_ICON[ride.type] || Bike;

              return (
                <div
                  className="rides-row rides-row-clickable"
                  key={ride.id}
                  onClick={() => navigate(`/activites/${ride.id}`)}
                >
                  <span className="ride-bike-icon"><Bike size={20} /></span>
                  <div className="date-cell">{formatDate(ride.started_at)}</div>
                  <span>{ride.distance_km ?? "—"} km</span>
                  <span>{formatDuration(ride.duration_seconds)}</span>
                  <span className="terrain-cell">
                    <TerrainIcon size={16} className="terrain-icon" />
                    {TYPE_LABELS[ride.type] || ride.type}
                  </span>
                  <span>{ride.elevation_m ? `${ride.elevation_m} m` : "—"}</span>
                  <span className="tire-used">
                    {tyre ? <>MICHELIN&nbsp;<strong>{tyre.model}</strong></> : "—"}
                  </span>
                  <StarRating value={ride.rating} />
                </div>
              );
            })}
          </div>
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
            const copied = copiedId === badge.id;
            const promoHidden = hiddenPromos[badge.id] ?? false;

            const handleCopy = () => {
              navigator.clipboard.writeText(badge.promo.code).catch(() => {});
              setCopiedId(badge.id);
              setTimeout(() => setCopiedId(null), 2000);
            };

            return (
              <div className={`badge-item ${earned ? "earned" : "locked"}`} key={badge.id}>
                <div className="badge-icon">
                  <Icon size={26} />
                </div>
                <strong>{badge.label}</strong>

                {earned ? (
                  <>
                    <button
                      className="badge-toggle-btn"
                      onClick={() => togglePromo(badge.id)}
                    >
                      {promoHidden ? (
                        <><ChevronDown size={12} /> Afficher la récompense</>
                      ) : (
                        <><ChevronUp size={12} /> Masquer</>
                      )}
                    </button>
                    {!promoHidden && (
                      <div className="badge-promo">
                        <p className="badge-promo-desc">{badge.promo.desc}</p>
                        <div className="badge-promo-code-row">
                          <span className="badge-promo-code">{badge.promo.code}</span>
                          <button className={`badge-promo-copy${copied ? " copied" : ""}`} onClick={handleCopy}>
                            {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
                          </button>
                        </div>
                        <span className="badge-promo-expires">Valide jusqu'au {badge.promo.expires}</span>
                      </div>
                    )}
                  </>
                ) : progress ? (
                  <>
                    <span className="badge-progress">
                      {progress.unit === "km"
                        ? `${progress.current.toLocaleString("fr-FR")} / ${progress.goal} km`
                        : `${progress.current} / ${progress.goal} ${progress.unit}`}
                    </span>
                    <div className="badge-locked-reward">
                      <Lock size={10} />
                      {badge.promo.desc}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}