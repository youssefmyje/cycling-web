import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Bike,
  Medal,
  Pencil,
  Save,
  X,
  CircleDot,
  Mountain,
  Route,
  Zap,
  Sun,
  Plus,
  ArrowRight,
} from "lucide-react";
import { getUser, profileApi, progressApi } from "../services/api";
import "../styles/ProfilePage.css";

const RIDER_TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const TERRAIN_LABELS = {
  route: "Route",
  road: "Route",
  gravel: "Gravel",
  mtb: "VTT",
  urban: "Urbain",
  city: "Urbain",
  ebike: "E-bike",
};
const PRIORITY_LABELS = {
  performance: "Performance",
  durability: "Durabilité",
  puncture_protection: "Anti-crevaison",
  grip: "Grip",
  long_distance: "Longue distance",
  racing: "Compétition",
  endurance: "Endurance",
  all_road: "Tout-terrain",
  touring: "Voyage",
  trekking: "Trekking",
  urban: "Urbain",
  cross_country: "Cross-country",
  trail: "Trail",
  enduro: "Enduro",
  downhill: "Descente",
  competition: "Compétition",
  access: "Access",
};
const WEATHER_LABELS = { dry: "Temps sec", wet: "Temps humide", mixed: "Tout temps" };

const today = () => new Date().toISOString().slice(0, 10);

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(Boolean(user?.id));
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [selectedBikeId, setSelectedBikeId] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", riderType: "route" });

  const [showAddBike, setShowAddBike] = useState(false);
  const [bikeForm, setBikeForm] = useState({ brand: "", model: "", category: "route", wheelSize: "" });

  const [showAddTyre, setShowAddTyre] = useState(false);
  const [tyreForm, setTyreForm] = useState({
    brand: "Michelin",
    model: "",
    size: "",
    mountedAt: today(),
    estimatedLifespanKm: "",
  });

  const loadEquipment = useCallback(() => {
    if (!user?.id) return;
    profileApi.getBikes(user.id).then((res) => {
      const items = res.data.items || [];
      setBikes(items);
      setSelectedBikeId((current) => current || items[0]?.id || null);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    Promise.allSettled([profileApi.get(user.id), progressApi.summary()]).then(
      ([profileRes, summaryRes]) => {
        if (profileRes.status === "fulfilled") {
          const data = profileRes.value.data;
          setProfile(data);
          setEditForm({ bio: data.bio || "", riderType: data.rider_type || "route" });
        }
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
        setLoading(false);
      }
    );

    loadEquipment();
  }, [user?.id, loadEquipment]);

  const saveProfile = async () => {
    try {
      const res = await profileApi.update(user.id, {
        bio: editForm.bio,
        rider_type: editForm.riderType,
      });
      setProfile(res.data);
      setEditMode(false);
    } catch (error) {
      console.error("Erreur mise à jour profil :", error.message);
    }
  };

  const submitBike = async (event) => {
    event.preventDefault();
    try {
      await profileApi.addBike(user.id, {
        brand: bikeForm.brand,
        model: bikeForm.model,
        category: bikeForm.category,
        wheel_size: bikeForm.wheelSize || undefined,
      });
      setBikeForm({ brand: "", model: "", category: "route", wheelSize: "" });
      setShowAddBike(false);
      loadEquipment();
    } catch (error) {
      console.error("Erreur ajout vélo :", error.message);
    }
  };

  const submitTyre = async (event) => {
    event.preventDefault();
    if (!selectedBikeId) return;
    try {
      await profileApi.addMountedTyre(user.id, {
        bike_id: selectedBikeId,
        brand: tyreForm.brand,
        model: tyreForm.model,
        size: tyreForm.size,
        mounted_at: tyreForm.mountedAt,
        estimated_lifespan_km: Number(tyreForm.estimatedLifespanKm),
      });
      setTyreForm({ brand: "Michelin", model: "", size: "", mountedAt: today(), estimatedLifespanKm: "" });
      setShowAddTyre(false);
      loadEquipment();
    } catch (error) {
      console.error("Erreur ajout pneu :", error.message);
    }
  };

  if (loading) {
    return <p className="loading-text">Chargement...</p>;
  }

  const selectedBike = bikes.find((bike) => bike.id === selectedBikeId) || bikes[0];

  const rawUsageTags = [
    ...(profile?.preferences?.terrains || []).map((value) => ({
      label: TERRAIN_LABELS[value] || value,
      icon: Route,
    })),
    ...(profile?.preferences?.priorities || []).map((value) => ({
      label: PRIORITY_LABELS[value] || value,
      icon: Zap,
    })),
    ...(profile?.preferences?.weather_preferences || []).map((value) => ({
      label: WEATHER_LABELS[value] || value,
      icon: Sun,
    })),
  ];
  const usageTags = rawUsageTags.filter(
    (tag, index) => rawUsageTags.findIndex((other) => other.label === tag.label) === index
  );

  return (
    <div className="profile-grid">

      <section className="profile-panel">
        <div className="profile-avatar-wrapper">
          <img
            src={
              profile?.avatar_url ||
              "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=600"
            }
            alt="Profil"
            className="profile-avatar"
          />
        </div>

        <h1>
          {user.first_name} {user.last_name}
        </h1>

        <div className="profile-badge">
          <ShieldCheck size={18} />
          Rider {RIDER_TYPE_LABELS[profile?.rider_type] || profile?.rider_type} — Niveau{" "}
          {user.level ?? 1}
        </div>

        {!editMode && profile?.bio && (
          <p className="profile-bio-display">{profile.bio}</p>
        )}

        <div className="profile-divider" />

        <div className="stats-row">
          <div className="stat">
            <Mountain className="stat-icon" />
            <strong>{(profile?.stats?.total_km ?? 0).toLocaleString("fr-FR")} km</strong>
            <small>total</small>
          </div>

          <div className="stat-border" />

          <div className="stat">
            <Bike className="stat-icon" />
            <strong>{profile?.stats?.total_rides ?? 0}</strong>
            <small>rides</small>
          </div>

          <div className="stat-border" />

          <div className="stat">
            <Medal className="stat-icon" />
            <strong>{summary?.badges_count ?? 0}</strong>
            <small>badges</small>
          </div>
        </div>

        {!editMode ? (
          <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
            <Pencil size={20} />
            Modifier le profil
          </button>
        ) : (
          <>
            <textarea
              className="bio-edit"
              value={editForm.bio}
              onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Quelques mots sur ta pratique du vélo..."
              rows={3}
            />

            <select
              className="rider-type-edit"
              value={editForm.riderType}
              onChange={(e) => setEditForm((prev) => ({ ...prev, riderType: e.target.value }))}
            >
              {Object.entries(RIDER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <div className="profile-actions">
              <button className="save-btn" onClick={saveProfile}>
                <Save size={19} />
                Enregistrer
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setEditForm({ bio: profile?.bio || "", riderType: profile?.rider_type || "route" });
                }}
              >
                <X size={19} />
                Annuler
              </button>
            </div>
          </>
        )}
      </section>

      <section className="equipment-panel">
        <div className="panel-header">
          <div>
            <h2>Mon Équipement</h2>
            <div className="title-line" />
          </div>

          {bikes.length > 1 && (
            <div className="bike-switcher">
              {bikes.map((bike) => (
                <button
                  key={bike.id}
                  className={bike.id === selectedBike?.id ? "active" : ""}
                  onClick={() => setSelectedBikeId(bike.id)}
                >
                  {bike.brand}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bike-block">
          {selectedBike && (
            <>
              <img src="/velo/velo.png" alt={`${selectedBike.brand} ${selectedBike.model}`} className="bike-image" />
              <h3>
                {selectedBike.brand} {selectedBike.model}
              </h3>
              <div className="bike-block-meta">
                {selectedBike.category && (
                  <span className="bike-meta-tag">{RIDER_TYPE_LABELS[selectedBike.category] || selectedBike.category}</span>
                )}
                {selectedBike.wheel_size && (
                  <span className="bike-meta-tag">{selectedBike.wheel_size}</span>
                )}
              </div>
            </>
          )}

          {showAddBike ? (
            <form className="bike-edit" onSubmit={submitBike}>
              <input
                value={bikeForm.brand}
                onChange={(e) => setBikeForm((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Marque (ex: Trek)"
                required
              />
              <input
                value={bikeForm.model}
                onChange={(e) => setBikeForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Modèle (ex: Emonda SL)"
                required
              />
              <select
                value={bikeForm.category}
                onChange={(e) => setBikeForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {Object.entries(RIDER_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                value={bikeForm.wheelSize}
                onChange={(e) => setBikeForm((prev) => ({ ...prev, wheelSize: e.target.value }))}
                placeholder="Taille de roue (ex: 700c)"
              />
              <div className="profile-actions">
                <button className="save-btn" type="submit">
                  <Save size={18} />
                  Ajouter
                </button>
                <button className="cancel-btn" type="button" onClick={() => setShowAddBike(false)}>
                  <X size={18} />
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button className="add-equipment-btn" onClick={() => setShowAddBike(true)}>
              <Plus size={20} />
              {selectedBike ? "Ajouter un autre vélo" : "Ajouter un vélo"}
            </button>
          )}
        </div>

        <div className="equipment-divider" />

        <h3 className="tires-title">
          <CircleDot size={26} />
          Mes pneus Michelin
        </h3>

        {selectedBike ? (
          <>
            {selectedBike.mounted_tyres?.length > 0 && (
              <div className="tires-grid">
                {selectedBike.mounted_tyres.map((tyre) => (
                  <article
                    className={`tire-card${tyre.catalogue_id ? " tire-card-clickable" : ""}`}
                    key={tyre.id}
                    onClick={() => tyre.catalogue_id && navigate(`/catalogue/${tyre.catalogue_id}`)}
                  >
                    <div className="tire-image-wrapper">
                      {tyre.pic1 || tyre.pic2 ? (
                        <img src={tyre.pic1 || tyre.pic2} alt={tyre.model} className="tire-image" />
                      ) : (
                        <CircleDot size={40} color="rgba(255,230,0,0.4)" />
                      )}
                    </div>
                    <div className="tire-card-body">
                      <p className="tire-brand">{tyre.brand}</p>
                      <h4>{tyre.model}</h4>
                      {tyre.size && <p className="tire-size">{tyre.size}</p>}
                      <div className="tire-separator" />
                      <p className="usage-label">Durée de vie</p>
                      <strong className="usage-value">
                        {Number(tyre.estimated_lifespan_km).toLocaleString("fr-FR")} km
                      </strong>
                      {tyre.catalogue_id && (
                        <div className="tire-card-arrow">
                          Voir la fiche <ArrowRight size={12} />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {showAddTyre ? (
              <form className="tyre-add-form" onSubmit={submitTyre}>
                <h4 className="tyre-add-title">Nouveau pneu</h4>
                <div className="tyre-add-fields">
                  <input
                    value={tyreForm.model}
                    onChange={(e) => setTyreForm((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="Modèle (ex: Power Cup 2)"
                    required
                  />
                  <input
                    value={tyreForm.size}
                    onChange={(e) => setTyreForm((prev) => ({ ...prev, size: e.target.value }))}
                    placeholder="Taille (ex: 700x28)"
                    required
                  />
                  <input
                    type="date"
                    value={tyreForm.mountedAt}
                    onChange={(e) => setTyreForm((prev) => ({ ...prev, mountedAt: e.target.value }))}
                    required
                  />
                  <input
                    type="number"
                    value={tyreForm.estimatedLifespanKm}
                    onChange={(e) =>
                      setTyreForm((prev) => ({ ...prev, estimatedLifespanKm: e.target.value }))
                    }
                    placeholder="Durée de vie (km)"
                    required
                  />
                </div>
                <div className="tyre-add-actions">
                  <button className="save-btn" type="submit">
                    <Save size={16} />
                    Ajouter
                  </button>
                  <button className="cancel-btn" type="button" onClick={() => setShowAddTyre(false)}>
                    <X size={16} />
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button className="add-tyre-btn" onClick={() => setShowAddTyre(true)}>
                <Plus size={16} />
                Ajouter un pneu Michelin
              </button>
            )}
          </>
        ) : (
          <p className="remaining-text">Ajoute d'abord un vélo pour pouvoir y monter des pneus.</p>
        )}

        <div className="favorite-usages">
          <h3>Mes usages favoris</h3>

          {usageTags.length > 0 ? (
            <div className="usage-tags">
              {usageTags.map(({ label, icon: Icon }, index) => (
                <span key={`${label}-${index}`}>
                  <Icon size={16} />
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="remaining-text">
              Fais le test « Trouver mon pneu » pour définir tes préférences de pratique.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
