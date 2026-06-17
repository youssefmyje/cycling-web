import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Navigation, Layers, TreePine, Building2, ArrowLeft } from "lucide-react";
import { getUser, activitiesApi, profileApi } from "../services/api";
import "../styles/MyRidesPage.css";

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
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}` : `${m} min`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export default function MyRidesPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      activitiesApi.list({ user_id: user.id, limit: 500 }),
      profileApi.getBikes(user.id),
    ]).then(([actRes, bikesRes]) => {
      if (actRes.status === "fulfilled") setActivities(actRes.value.data.items || []);
      if (bikesRes.status === "fulfilled") setBikes(bikesRes.value.data.items || []);
      setLoading(false);
    });
  }, [user?.id]);

  const tyreByBikeId = new Map(bikes.map((b) => [b.id, b.mounted_tyres?.[0]]));

  const completed = activities
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

  const filtered = filter === "all" ? completed : completed.filter((r) => r.type === filter);

  if (loading) return <p className="loading-text">Chargement...</p>;

  return (
    <section className="my-rides-content">
      <div className="my-rides-header">
        <button className="my-rides-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Retour
        </button>
        <h1>Mes Rides <span>{filtered.length}</span></h1>
        <div className="my-rides-filters">
          {["all", "route", "gravel", "mtb", "urban"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Tous" : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="my-rides-table-wrapper">
        <div className="rides-table">
          <div className="rides-head my-rides-head">
            <span></span>
            <span>Date ↓</span>
            <span>Distance</span>
            <span>Durée</span>
            <span>Terrain</span>
            <span>Dénivelé</span>
            <span>Pneu utilisé</span>
            <span>Note</span>
          </div>

          {filtered.length === 0 && (
            <p className="my-rides-empty">Aucune sortie pour ce filtre.</p>
          )}

          {filtered.map((ride) => {
            const tyre = tyreByBikeId.get(ride.bike_id);
            const TerrainIcon = TERRAIN_ICON[ride.type] || Bike;
            return (
              <div
                className="rides-row rides-row-clickable my-rides-row"
                key={ride.id}
                onClick={() => navigate(`/activites/${ride.id}`)}
              >
                <span className="ride-bike-icon"><Bike size={18} /></span>
                <div className="date-cell">{formatDate(ride.started_at)}</div>
                <span>{ride.distance_km ?? "—"} km</span>
                <span>{formatDuration(ride.duration_seconds)}</span>
                <span className="terrain-cell">
                  <TerrainIcon size={15} className="terrain-icon" />
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
      </div>
    </section>
  );
}
