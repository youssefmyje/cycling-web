import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Save, CheckCircle2, Download, RefreshCw, X, Activity, Globe, Lock } from "lucide-react";
import { getUser, profileApi, activitiesApi, stravaApi } from "../services/api";
import "../styles/NewActivityPage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const WEATHER_LABELS = { dry: "Sec", wet: "Humide", mixed: "Mitigé" };
const STRAVA_TYPE_MAP = { GravelRide: "gravel", MountainBikeRide: "mtb", Commute: "urban" };

function deriveType(sportType) {
  return STRAVA_TYPE_MAP[sportType] || "route";
}

function toIsoNow() {
  return new Date().toISOString().slice(0, 16);
}

function fmtDuration(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}` : `${m} min`;
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="toggle-row" onClick={() => onChange(!checked)}>
      {checked ? <Globe size={15} color="#ffe600" /> : <Lock size={15} color="#888" />}
      <span>{label}</span>
      <div className={`toggle-switch ${checked ? "on" : ""}`} />
    </div>
  );
}

export default function NewActivityPage() {
  const navigate = useNavigate();
  const user = getUser();
  const stravaInitRef = useRef(false);

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
    isPublic: true,
  });

  const [gpxForm, setGpxForm] = useState({ bikeId: "", type: "route", weather: "dry", isPublic: true });
  const [gpxFile, setGpxFile] = useState(null);

  // Strava state
  const stravaImportKey = `strava_imported_${user?.id || ""}`;
  const [stravaStatus, setStravaStatus] = useState("disconnected");
  const [stravaActivities, setStravaActivities] = useState([]);
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`strava_imported_${user?.id || ""}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [expandedId, setExpandedId] = useState(null);
  const [importForms, setImportForms] = useState({});

  useEffect(() => {
    if (!user?.id) return;
    profileApi.getBikes(user.id).then((res) => {
      const items = res.data.items || [];
      setBikes(items);
      const firstId = items[0]?.id || "";
      setManualForm((prev) => ({ ...prev, bikeId: firstId }));
      setGpxForm((prev) => ({ ...prev, bikeId: firstId }));
    });
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava_connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      setTab("strava");
      stravaInitRef.current = true;
      doLoadStrava();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "strava" && !stravaInitRef.current) {
      stravaInitRef.current = true;
      doLoadStrava();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doLoadStrava() {
    setStravaStatus("loading");
    try {
      const res = await stravaApi.listActivities();
      setStravaActivities(res.data || res || []);
      setStravaStatus("ready");
    } catch (err) {
      if (err.message?.includes("not connected")) {
        setStravaStatus("disconnected");
      } else if (err.message?.includes("not configured")) {
        setStravaStatus("not_configured");
      } else {
        setStravaStatus("error");
      }
    }
  }

  async function connectStrava() {
    setStravaStatus("connecting");
    try {
      const res = await stravaApi.connect();
      const authUrl = res.data.auth_url;

      const popup = window.open(
        authUrl,
        "strava-oauth",
        "width=620,height=720,left=200,top=80,noopener=no"
      );

      if (!popup) {
        window.location.href = authUrl;
        return;
      }

      const interval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(interval);
            doLoadStrava();
            return;
          }
          const href = popup.location?.href || "";
          if (href.includes("strava_connected=1")) {
            clearInterval(interval);
            popup.close();
            doLoadStrava();
          }
        } catch (_) {
          // Cross-origin — still on Strava's domain
        }
      }, 600);
    } catch (err) {
      if (err.message?.includes("not configured")) {
        setStravaStatus("not_configured");
      } else {
        setStravaStatus("error");
      }
    }
  }

  function patchImportForm(stravaId, updates) {
    setImportForms((prev) => ({
      ...prev,
      [stravaId]: { ...(prev[stravaId] || {}), ...updates },
    }));
  }

  function getForm(stravaId, sportType) {
    return {
      type: deriveType(sportType),
      weather: "dry",
      bikeId: bikes[0]?.id || "",
      isPublic: true,
      ...(importForms[stravaId] || {}),
    };
  }

  async function importActivity(stravaId, sportType) {
    const form = getForm(stravaId, sportType);
    setImportingId(stravaId);
    setError("");
    try {
      await stravaApi.import({
        strava_activity_id: stravaId,
        bike_id: form.bikeId || undefined,
        type: form.type,
        weather: form.weather,
        is_public: form.isPublic,
      });
      setImportedIds((prev) => {
        const next = new Set([...prev, stravaId]);
        try { localStorage.setItem(stravaImportKey, JSON.stringify([...next])); } catch {}
        return next;
      });
      setExpandedId(null);
      setImportingId(null);
    } catch (err) {
      setError(err.message || "Import impossible.");
      setImportingId(null);
    }
  }

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
        is_public: manualForm.isPublic,
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
        isPublic: gpxForm.isPublic,
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
        <button
          className={`strava-tab-btn ${tab === "strava" ? "active" : ""}`}
          onClick={() => setTab("strava")}
        >
          <Activity size={14} />
          Strava
        </button>
        <button className={tab === "gpx" ? "active" : ""} onClick={() => setTab("gpx")}>
          Importer un GPX
        </button>
        <button className={tab === "manual" ? "active" : ""} onClick={() => setTab("manual")}>
          Saisie manuelle
        </button>
      </div>

      {/* ── MANUEL ── */}
      {tab === "manual" && (
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
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              Météo
              <select
                value={manualForm.weather}
                onChange={(e) => setManualForm((prev) => ({ ...prev, weather: e.target.value }))}
              >
                {Object.entries(WEATHER_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
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
                onChange={(e) => setManualForm((prev) => ({ ...prev, distanceKm: e.target.value }))}
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
                onChange={(e) => setManualForm((prev) => ({ ...prev, elevationM: e.target.value }))}
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

          <ToggleRow
            label="Partager dans la communauté"
            checked={manualForm.isPublic}
            onChange={(v) => setManualForm((prev) => ({ ...prev, isPublic: v }))}
          />

          {error && <p className="new-activity-error">{error}</p>}

          <button type="submit" className="new-activity-submit" disabled={submitting}>
            <Save size={20} />
            {submitting ? "Enregistrement..." : "Enregistrer la sortie"}
          </button>
        </form>
      )}

      {/* ── GPX ── */}
      {tab === "gpx" && (
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
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              Météo
              <select
                value={gpxForm.weather}
                onChange={(e) => setGpxForm((prev) => ({ ...prev, weather: e.target.value }))}
              >
                {Object.entries(WEATHER_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
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

          <ToggleRow
            label="Partager dans la communauté"
            checked={gpxForm.isPublic}
            onChange={(v) => setGpxForm((prev) => ({ ...prev, isPublic: v }))}
          />

          {error && <p className="new-activity-error">{error}</p>}

          <button type="submit" className="new-activity-submit" disabled={submitting}>
            <Save size={20} />
            {submitting ? "Import en cours..." : "Importer la sortie"}
          </button>
        </form>
      )}

      {/* ── STRAVA ── */}
      {tab === "strava" && (
        <div className="strava-panel">
          {stravaStatus === "not_configured" && (
            <div className="strava-center">
              <div className="strava-logo-circle">
                <Activity size={38} color="#FC4C02" />
              </div>
              <h3>Intégration non configurée</h3>
              <p>
                Les clés Strava (<code>STRAVA_CLIENT_ID</code> / <code>STRAVA_CLIENT_SECRET</code>)
                ne sont pas encore renseignées dans le <code>.env</code> du backend.
              </p>
            </div>
          )}

          {stravaStatus === "disconnected" && (
            <div className="strava-center">
              <div className="strava-logo-circle">
                <Activity size={38} color="#FC4C02" />
              </div>
              <h3>Importer depuis Strava</h3>
              <p>
                Connecte ton compte Strava pour retrouver automatiquement tes sorties
                avec tracé GPS et statistiques précises.
              </p>
              <button className="strava-connect-btn" onClick={connectStrava}>
                <Activity size={18} />
                Connecter Strava
              </button>
            </div>
          )}

          {stravaStatus === "connecting" && (
            <div className="strava-center">
              <div className="strava-logo-circle strava-pulse">
                <Activity size={38} color="#FC4C02" />
              </div>
              <h3>Autorisation en cours…</h3>
              <p>
                Une fenêtre Strava vient de s'ouvrir.<br />
                Autorise l'accès puis reviens ici — la page se met à jour automatiquement.
              </p>
              <button className="strava-ghost-btn" onClick={doLoadStrava}>
                <RefreshCw size={15} />
                Actualiser manuellement
              </button>
            </div>
          )}

          {stravaStatus === "loading" && (
            <div className="strava-center">
              <div className="strava-logo-circle strava-pulse">
                <Activity size={38} color="#FC4C02" />
              </div>
              <p>Chargement de tes activités Strava…</p>
            </div>
          )}

          {stravaStatus === "error" && (
            <div className="strava-center">
              <h3>Erreur de connexion</h3>
              <p>Impossible de contacter Strava. Vérifie ta connexion et réessaie.</p>
              <button className="strava-connect-btn" onClick={connectStrava}>
                <Activity size={18} />
                Réessayer
              </button>
            </div>
          )}

          {stravaStatus === "ready" && (
            <>
              <div className="strava-list-header">
                <span>
                  <Activity size={15} color="#FC4C02" />
                  {stravaActivities.length} activité{stravaActivities.length !== 1 ? "s" : ""} récentes
                  {importedIds.size > 0 && (
                    <span className="strava-imported-count">· {importedIds.size} importée{importedIds.size > 1 ? "s" : ""}</span>
                  )}
                </span>
                <button className="strava-ghost-btn" onClick={doLoadStrava}>
                  <RefreshCw size={13} />
                  Actualiser
                </button>
              </div>

              {stravaActivities.length === 0 ? (
                <p style={{ color: "#b8b8b8", fontSize: 14, textAlign: "center", padding: "30px 0" }}>
                  Aucune activité trouvée sur ton compte Strava.
                </p>
              ) : (
                <div className="strava-activity-list">
                  {stravaActivities.map((activity) => {
                    const isExpanded = expandedId === activity.strava_id;
                    const isImporting = importingId === activity.strava_id;
                    const isImported = importedIds.has(activity.strava_id);
                    const form = getForm(activity.strava_id, activity.sport_type);

                    return (
                      <div
                        key={activity.strava_id}
                        className={`strava-activity-card ${isExpanded ? "expanded" : ""} ${isImported ? "imported" : ""}`}
                      >
                        <div className="strava-activity-row">
                          <div className="strava-activity-info">
                            <strong>{activity.name}</strong>
                            <div className="strava-activity-meta">
                              <span>{activity.distance_km} km</span>
                              <span className="sep">·</span>
                              <span>{fmtDuration(activity.duration_seconds)}</span>
                              <span className="sep">·</span>
                              <span>↑ {activity.elevation_m} m</span>
                              <span className="sep">·</span>
                              <span>
                                {new Date(activity.started_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                          </div>

                          {isImported ? (
                            <span className="strava-imported-badge">
                              <CheckCircle2 size={14} />
                              Importé
                            </span>
                          ) : (
                            <button
                              className={`strava-import-toggle ${isExpanded ? "cancel" : ""}`}
                              onClick={() => {
                                setError("");
                                setExpandedId(isExpanded ? null : activity.strava_id);
                              }}
                              disabled={isImporting}
                            >
                              {isExpanded ? <X size={15} /> : <Download size={15} />}
                              {isExpanded ? "Annuler" : "Importer"}
                            </button>
                          )}
                        </div>

                        {isExpanded && !isImported && (
                          <div className="strava-import-form">
                            <div className="strava-import-selects">
                              <label>
                                Vélo
                                <select
                                  value={form.bikeId}
                                  onChange={(e) =>
                                    patchImportForm(activity.strava_id, { bikeId: e.target.value })
                                  }
                                >
                                  {bikes.map((bike) => (
                                    <option key={bike.id} value={bike.id}>
                                      {bike.brand} {bike.model}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Type
                                <select
                                  value={form.type}
                                  onChange={(e) =>
                                    patchImportForm(activity.strava_id, { type: e.target.value })
                                  }
                                >
                                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Météo
                                <select
                                  value={form.weather}
                                  onChange={(e) =>
                                    patchImportForm(activity.strava_id, { weather: e.target.value })
                                  }
                                >
                                  {Object.entries(WEATHER_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <ToggleRow
                              label="Partager dans la communauté"
                              checked={form.isPublic}
                              onChange={(v) => patchImportForm(activity.strava_id, { isPublic: v })}
                            />

                            {error && <p className="new-activity-error">{error}</p>}

                            <button
                              className="new-activity-submit"
                              onClick={() => importActivity(activity.strava_id, activity.sport_type)}
                              disabled={isImporting}
                            >
                              <Save size={18} />
                              {isImporting ? "Import en cours…" : "Confirmer l'import"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
