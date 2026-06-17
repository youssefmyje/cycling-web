import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Save, CheckCircle2 } from "lucide-react";
import { getUser, profileApi, activitiesApi } from "../services/api";
import "../styles/NewActivityPage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const WEATHER_LABELS = { dry: "Sec", wet: "Humide", mixed: "Mitigé" };

function toIsoNow() {
  return new Date().toISOString().slice(0, 16);
}

export default function NewActivityPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [tab, setTab] = useState("manual");
  const [bikes, setBikes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [manualForm, setManualForm] = useState({
    bikeId: "",
    type: "route",
    weather: "dry",
    startedAt: toIsoNow(),
    distanceKm: "",
    durationMinutes: "",
    elevationM: "",
    averageSpeedKmh: "",
  });

  const [gpxForm, setGpxForm] = useState({ bikeId: "", type: "route", weather: "dry" });
  const [gpxFile, setGpxFile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    profileApi.getBikes(user.id).then((res) => {
      const items = res.data.items || [];
      setBikes(items);
      const firstBikeId = items[0]?.id || "";
      setManualForm((prev) => ({ ...prev, bikeId: firstBikeId }));
      setGpxForm((prev) => ({ ...prev, bikeId: firstBikeId }));
    });
  }, [user?.id]);

  const submitManual = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const created = await activitiesApi.create({
        user_id: user.id,
        bike_id: manualForm.bikeId,
        type: manualForm.type,
        started_at: new Date(manualForm.startedAt).toISOString(),
        weather: manualForm.weather,
      });

      await activitiesApi.complete(created.data.id, {
        distance_km: Number(manualForm.distanceKm),
        duration_seconds: Math.round(Number(manualForm.durationMinutes) * 60),
        elevation_m: Number(manualForm.elevationM || 0),
        average_speed_kmh:
          Number(manualForm.averageSpeedKmh) ||
          Number(manualForm.distanceKm) / (Number(manualForm.durationMinutes) / 60),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer la sortie.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitGpx = async (event) => {
    event.preventDefault();
    if (!gpxFile) return;
    setError("");
    setSubmitting(true);

    try {
      await activitiesApi.importGpx(gpxFile, {
        bikeId: gpxForm.bikeId || undefined,
        type: gpxForm.type,
        weather: gpxForm.weather,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Impossible d'importer ce fichier GPX.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
        <section className="new-activity-content">
          <div className="new-activity-success">
            <CheckCircle2 size={64} color="#FFE600" />
            <h2>Sortie enregistrée !</h2>
            <p>Ta progression et ton fil communauté viennent d'être mis à jour.</p>
            <div className="new-activity-success-actions">
              <button onClick={() => navigate("/")}>Voir l'accueil</button>
              <button onClick={() => navigate("/progres")} className="secondary">
                Voir mes progrès
              </button>
            </div>
          </div>
        </section>
    );
  }

  if (bikes.length === 0) {
    return (
        <section className="new-activity-content">
          <p className="new-activity-empty">
            Ajoute d'abord un vélo sur ton profil avant d'enregistrer une sortie.
          </p>
          <button className="new-activity-empty-btn" onClick={() => navigate("/profil")}>
            Aller à mon profil
          </button>
        </section>
    );
  }

  return (

      <section className="new-activity-content">
        <header className="new-activity-header">
          <h1>Nouvelle sortie</h1>
        </header>

        <div className="new-activity-tabs">
          <button className={tab === "manual" ? "active" : ""} onClick={() => setTab("manual")}>
            Saisie manuelle
          </button>
          <button className={tab === "gpx" ? "active" : ""} onClick={() => setTab("gpx")}>
            Importer un GPX
          </button>
        </div>

        {tab === "manual" ? (
          <form className="new-activity-form" onSubmit={submitManual}>
            <label>
              Vélo
              <select
                value={manualForm.bikeId}
                onChange={(e) => setManualForm((prev) => ({ ...prev, bikeId: e.target.value }))}
                required
              >
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.brand} {bike.model}
                  </option>
                ))}
              </select>
            </label>

            <div className="new-activity-row">
              <label>
                Type
                <select
                  value={manualForm.type}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Météo
                <select
                  value={manualForm.weather}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, weather: e.target.value }))}
                >
                  {Object.entries(WEATHER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Date et heure de départ
              <input
                type="datetime-local"
                value={manualForm.startedAt}
                onChange={(e) => setManualForm((prev) => ({ ...prev, startedAt: e.target.value }))}
                required
              />
            </label>

            <div className="new-activity-row">
              <label>
                Distance (km)
                <input
                  type="number"
                  step="0.1"
                  value={manualForm.distanceKm}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, distanceKm: e.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Durée (minutes)
                <input
                  type="number"
                  value={manualForm.durationMinutes}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, durationMinutes: e.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <div className="new-activity-row">
              <label>
                Dénivelé (m)
                <input
                  type="number"
                  value={manualForm.elevationM}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, elevationM: e.target.value }))
                  }
                />
              </label>

              <label>
                Vitesse moyenne (km/h)
                <input
                  type="number"
                  step="0.1"
                  placeholder="auto si vide"
                  value={manualForm.averageSpeedKmh}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, averageSpeedKmh: e.target.value }))
                  }
                />
              </label>
            </div>

            {error && <p className="new-activity-error">{error}</p>}

            <button type="submit" className="new-activity-submit" disabled={submitting}>
              <Save size={20} />
              {submitting ? "Enregistrement..." : "Enregistrer la sortie"}
            </button>
          </form>
        ) : (
          <form className="new-activity-form" onSubmit={submitGpx}>
            <label>
              Vélo
              <select
                value={gpxForm.bikeId}
                onChange={(e) => setGpxForm((prev) => ({ ...prev, bikeId: e.target.value }))}
              >
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.brand} {bike.model}
                  </option>
                ))}
              </select>
            </label>

            <div className="new-activity-row">
              <label>
                Type
                <select
                  value={gpxForm.type}
                  onChange={(e) => setGpxForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Météo
                <select
                  value={gpxForm.weather}
                  onChange={(e) => setGpxForm((prev) => ({ ...prev, weather: e.target.value }))}
                >
                  {Object.entries(WEATHER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="new-activity-dropzone">
              <Upload size={28} />
              {gpxFile ? gpxFile.name : "Choisir un fichier .gpx"}
              <input
                type="file"
                accept=".gpx"
                onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                hidden
                required
              />
            </label>

            {error && <p className="new-activity-error">{error}</p>}

            <button type="submit" className="new-activity-submit" disabled={submitting}>
              <Save size={20} />
              {submitting ? "Import en cours..." : "Importer la sortie"}
            </button>
          </form>
        )}
      </section>
  );
}
