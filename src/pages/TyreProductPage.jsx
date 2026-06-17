import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, ExternalLink, Weight, Gauge, Layers } from "lucide-react";
import { catalogueApi } from "../services/api";
import "../styles/TyreProductPage.css";

const SEGMENT_LABELS = {
  racing: "Racing",
  competition: "Compétition",
  performance: "Performance",
  access: "Access",
};

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="tyre-spec-row">
      <span className="tyre-spec-label">{label}</span>
      <span className="tyre-spec-value">{value}</span>
    </div>
  );
}

function TechTag({ value }) {
  if (!value) return null;
  return (
    <div className="tyre-tech-tags">
      {value.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
        <span key={t} className="tyre-tech-tag">{t}</span>
      ))}
    </div>
  );
}

export default function TyreProductPage() {
  const { tyreId } = useParams();
  const navigate = useNavigate();
  const [tyre, setTyre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    catalogueApi.get(tyreId)
      .then((res) => setTyre(res.data))
      .catch((err) => setError(err.message || "Produit introuvable."))
      .finally(() => setLoading(false));
  }, [tyreId]);

  if (loading) return <p className="tyre-product-loading">Chargement...</p>;
  if (error || !tyre) return <p className="tyre-product-loading">{error || "Produit introuvable."}</p>;

  const name = tyre.web_range_name || tyre.web_product_designation || "Pneu Michelin";
  const segmentLabel = SEGMENT_LABELS[tyre.segment?.toLowerCase()] || tyre.segment;
  const retailerUrl = `https://www.google.com/search?q=acheter+Michelin+${encodeURIComponent(name)}+pneu+vélo`;

  return (
    <section className="tyre-product-content">
      <button className="tyre-product-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Retour
      </button>

      <div className="tyre-product-grid">
        <div className="tyre-product-visual">
          {(tyre.pic1 || tyre.pic2) ? (
            <img src={tyre.pic || tyre.pic1} alt={name} />
          ) : (
            <div className="tyre-product-no-img">
              <Layers size={80} color="#fce500" />
            </div>
          )}
          {tyre.pic1 && tyre.pic2 && (
            <img src={tyre.pic2} alt={name} className="tyre-product-img2" />
          )}
        </div>

        <div className="tyre-product-info">
          <div className="tyre-product-brand">MICHELIN</div>
          <h1 className="tyre-product-name">{name}</h1>

          <div className="tyre-product-badges">
            {segmentLabel && <span className="tyre-badge tyre-badge-segment">{segmentLabel}</span>}
            {tyre.cycle_type_web && <span className="tyre-badge">{tyre.cycle_type_web}</span>}
            {tyre.sealing && <span className="tyre-badge tyre-badge-green">{tyre.sealing}</span>}
          </div>

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
            <a
              href={retailerUrl}
              target="_blank"
              rel="noreferrer"
              className="tyre-buy-btn"
            >
              <ShoppingCart size={18} />
              Trouver un revendeur
            </a>
            <a
              href="https://www.michelin.fr/velos"
              target="_blank"
              rel="noreferrer"
              className="tyre-michelin-btn"
            >
              michelin.fr
              <ExternalLink size={16} />
            </a>
          </div>

          <div className="tyre-product-specs">
            <h3>Caractéristiques</h3>
            <div className="tyre-specs-grid">
              <SpecRow label="Taille" value={tyre.width_etrto && tyre.diameter_etrto ? `${tyre.width_etrto} × ${tyre.diameter_etrto}` : null} />
              <SpecRow label="Largeur" value={tyre.web_width_mm ? `${tyre.web_width_mm} mm` : null} />
              <SpecRow label="Diamètre" value={tyre.web_diameter_inch ? `${tyre.web_diameter_inch}"` : null} />
              <SpecRow label="Poids" value={tyre.weight_g ? `${tyre.weight_g} g` : null} />
              <SpecRow label="TPI" value={tyre.tpi} />
              <SpecRow label="Pression min" value={tyre.min_pressure_bar ? `${tyre.min_pressure_bar} bar` : null} />
              <SpecRow label="Pression max" value={tyre.max_pressure_bar ? `${tyre.max_pressure_bar} bar` : null} />
              <SpecRow label="Montage" value={tyre.bead} />
              <SpecRow label="Valve" value={tyre.valve_tube} />
              <SpecRow label="Terrains" value={tyre.terrain_types} />
              <SpecRow label="Usage" value={tyre.use} />
            </div>
          </div>

          {(tyre.rubber_technologies || tyre.casing_technologies || tyre.tread_pattern_technologies || tyre.reinforcement_technologies) && (
            <div className="tyre-product-tech">
              <h3>Technologies</h3>
              <TechTag value={tyre.rubber_technologies} />
              <TechTag value={tyre.casing_technologies} />
              <TechTag value={tyre.tread_pattern_technologies} />
              <TechTag value={tyre.reinforcement_technologies} />
              <TechTag value={tyre.ebike_technologies} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}