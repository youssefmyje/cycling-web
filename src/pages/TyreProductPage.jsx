import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  ExternalLink,
  Layers,
  Weight,
  Gauge,
  Ruler,
  Timer,
  ChevronRight,
} from "lucide-react";
import { catalogueApi } from "../services/api";
import "../styles/TyreProductPage.css";

const SEGMENT_LABELS = {
  racing: "Racing",
  competition: "Compétition",
  performance: "Performance",
  access: "Access",
};

const TECH_CATEGORIES = [
  { key: "rubber_technologies",        label: "Gomme" },
  { key: "casing_technologies",        label: "Carcasse" },
  { key: "tread_pattern_technologies", label: "Sculpture" },
  { key: "reinforcement_technologies", label: "Renfort" },
  { key: "ebike_technologies",         label: "E-Bike" },
];

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="tyre-spec-row">
      <span className="tyre-spec-label">{label}</span>
      <span className="tyre-spec-value">{value}</span>
    </div>
  );
}

export default function TyreProductPage() {
  const { tyreId } = useParams();
  const navigate = useNavigate();
  const [tyre, setTyre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    catalogueApi.get(tyreId)
      .then((res) => { setTyre(res.data); setActiveImg(0); })
      .catch((err) => setError(err.message || "Produit introuvable."))
      .finally(() => setLoading(false));
  }, [tyreId]);

  if (loading) return <p className="tyre-product-loading">Chargement...</p>;
  if (error || !tyre) return <p className="tyre-product-loading">{error || "Produit introuvable."}</p>;

  const name = tyre.web_range_name || tyre.web_product_designation || "Pneu Michelin";
  const segmentLabel = SEGMENT_LABELS[tyre.segment?.toLowerCase()] || tyre.segment;
  const retailerUrl = `https://www.google.com/search?q=acheter+Michelin+${encodeURIComponent(name)}+pneu+vélo`;

  const images = [tyre.pic1, tyre.pic2].filter(Boolean);
  const displayImg = images[activeImg] || null;

  const keySpecs = [
    tyre.weight_g && { icon: Weight,  label: "Poids",     value: `${tyre.weight_g} g` },
    (tyre.min_pressure_bar || tyre.max_pressure_bar) && {
      icon: Gauge,
      label: "Pression",
      value: tyre.min_pressure_bar && tyre.max_pressure_bar
        ? `${tyre.min_pressure_bar}–${tyre.max_pressure_bar} bar`
        : `${tyre.min_pressure_bar || tyre.max_pressure_bar} bar`,
    },
    tyre.web_width_mm && { icon: Ruler,  label: "Largeur",   value: `${tyre.web_width_mm} mm` },
    tyre.tpi          && { icon: Layers, label: "TPI",       value: String(tyre.tpi) },
    tyre.estimated_lifespan_km && {
      icon: Timer,
      label: "Durée de vie",
      value: `${Number(tyre.estimated_lifespan_km).toLocaleString("fr-FR")} km`,
    },
  ].filter(Boolean);

  const hasTech = TECH_CATEGORIES.some((c) => tyre[c.key]);

  return (
    <section className="tyre-product-content">
      <button className="tyre-product-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* ── HERO ── */}
      <div className="tyre-hero">

        {/* Gallery */}
        <div className="tyre-gallery">
          <div className="tyre-gallery-main">
            {displayImg ? (
              <img src={displayImg} alt={name} />
            ) : (
              <div className="tyre-gallery-placeholder">
                <Layers size={80} color="rgba(252,229,0,0.4)" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="tyre-gallery-thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`tyre-thumb${i === activeImg ? " active" : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={src} alt={`vue ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="tyre-hero-info">
          <p className="tyre-product-brand">MICHELIN</p>
          <h1 className="tyre-product-name">{name}</h1>

          <div className="tyre-product-badges">
            {segmentLabel && <span className="tyre-badge tyre-badge-segment">{segmentLabel}</span>}
            {tyre.cycle_type_web && <span className="tyre-badge">{tyre.cycle_type_web}</span>}
            {tyre.sealing && <span className="tyre-badge tyre-badge-green">{tyre.sealing}</span>}
            {tyre.terrain_types && <span className="tyre-badge">{tyre.terrain_types}</span>}
          </div>

          {tyre.use && <p className="tyre-use-description">{tyre.use}</p>}

          <div className="tyre-product-price">
            {tyre.price > 0 ? (
              <>
                <strong>{tyre.price.toFixed(2)} €</strong>
                <span>Prix indicatif</span>
              </>
            ) : (
              <strong>Prix sur demande</strong>
            )}
          </div>

          <div className="tyre-product-actions">
            <a href={retailerUrl} target="_blank" rel="noreferrer" className="tyre-buy-btn">
              <ShoppingCart size={17} />
              Trouver un revendeur
            </a>
            <a href="https://www.michelin.fr/velos" target="_blank" rel="noreferrer" className="tyre-michelin-btn">
              michelin.fr
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* ── KEY SPECS TILES ── */}
      {keySpecs.length > 0 && (
        <div className="tyre-key-specs">
          {keySpecs.map(({ icon: Icon, label, value }) => (
            <div className="tyre-key-spec-tile" key={label}>
              <div className="tyre-key-spec-icon">
                <Icon size={20} />
              </div>
              <div>
                <span className="tyre-key-spec-label">{label}</span>
                <strong className="tyre-key-spec-value">{value}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SPECS TABLE ── */}
      <div className="tyre-section">
        <h3 className="tyre-section-title">
          Caractéristiques techniques
          <ChevronRight size={16} />
        </h3>
        <div className="tyre-specs-grid">
          <SpecRow label="Taille ETRTO" value={tyre.width_etrto && tyre.diameter_etrto ? `${tyre.width_etrto} × ${tyre.diameter_etrto}` : null} />
          <SpecRow label="Largeur" value={tyre.web_width_mm ? `${tyre.web_width_mm} mm` : null} />
          <SpecRow label="Diamètre" value={tyre.web_diameter_inch ? `${tyre.web_diameter_inch}"` : null} />
          <SpecRow label="Poids" value={tyre.weight_g ? `${tyre.weight_g} g` : null} />
          <SpecRow label="TPI" value={tyre.tpi} />
          <SpecRow label="Pression min" value={tyre.min_pressure_bar ? `${tyre.min_pressure_bar} bar` : null} />
          <SpecRow label="Pression max" value={tyre.max_pressure_bar ? `${tyre.max_pressure_bar} bar` : null} />
          <SpecRow label="Montage" value={tyre.bead} />
          <SpecRow label="Valve" value={tyre.valve_tube} />
          <SpecRow label="Type de vélo" value={tyre.cycle_type_web} />
          <SpecRow label="Usage" value={tyre.use} />
          <SpecRow label="Terrains" value={tyre.terrain_types} />
          <SpecRow label="Durée de vie" value={tyre.estimated_lifespan_km ? `${Number(tyre.estimated_lifespan_km).toLocaleString("fr-FR")} km` : null} />
        </div>
      </div>

      {/* ── TECHNOLOGIES ── */}
      {hasTech && (
        <div className="tyre-section tyre-section-tech">
          <h3 className="tyre-section-title">
            Technologies Michelin
            <ChevronRight size={16} />
          </h3>
          <div className="tyre-tech-categories">
            {TECH_CATEGORIES.map(({ key, label }) => {
              const raw = tyre[key];
              if (!raw) return null;
              const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
              return (
                <div className="tyre-tech-category" key={key}>
                  <span className="tyre-tech-category-label">{label}</span>
                  <div className="tyre-tech-tags">
                    {tags.map((t) => (
                      <span key={t} className="tyre-tech-tag">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
