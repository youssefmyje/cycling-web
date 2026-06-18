import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, ExternalLink, Package } from "lucide-react";
import { getUser, profileApi, recommendationsApi } from "../services/api";
import "../styles/RecommendationPage.css";

const RIDER_TYPES = [
  { value: "route", label: "Route" },
  { value: "gravel", label: "Gravel" },
  { value: "mtb", label: "VTT" },
  { value: "urban", label: "Urbain / Trekking" },
];

const TERRAINS = [
  { value: "road", label: "Bitume / Route" },
  { value: "mixed", label: "Mixte" },
  { value: "trail", label: "Trail / Hors-route" },
  { value: "city", label: "Ville" },
];

const PRIORITIES = [
  { value: "racing", label: "Racing", hint: "Le haut de gamme, pour la compétition" },
  { value: "performance", label: "Performance", hint: "Vitesse et légèreté avant tout" },
  { value: "grip", label: "Grip / Adhérence", hint: "Tenue de route et sécurité" },
  { value: "durability", label: "Durabilité", hint: "Longévité et résistance" },
];

const WEATHERS = [
  { value: "dry", label: "Temps sec" },
  { value: "mixed", label: "Mixte" },
  { value: "wet", label: "Temps humide / pluie" },
];

const RIDE_FREQUENCIES = [
  { value: "frequent", label: "Fréquent", hint: "Plusieurs fois par semaine" },
  { value: "regular", label: "Régulier", hint: "Une fois par semaine" },
  { value: "occasional", label: "Occasionnel", hint: "Quelques fois par mois" },
];

const TUBELESS_OPTIONS = [
  { value: true, label: "Tubeless Ready", hint: "Montage sans chambre à air" },
  { value: false, label: "Chambre à air", hint: "Montage traditionnel" },
];

const STEP_IDS = ["rider_type", "terrain", "priority", "tubeless", "weather", "ride_frequency"];

const STEP_TITLES = {
  rider_type: "Quel type de cycliste es-tu ?",
  terrain: "Sur quel terrain roules-tu le plus ?",
  priority: "Quelle est ta priorité ?",
  tubeless: "Quel montage utilises-tu ?",
  weather: "Par quel temps roules-tu ?",
  ride_frequency: "À quelle fréquence roules-tu ?",
};

function getOptions(stepId) {
  switch (stepId) {
    case "rider_type":
      return RIDER_TYPES;
    case "terrain":
      return TERRAINS;
    case "priority":
      return PRIORITIES;
    case "tubeless":
      return TUBELESS_OPTIONS;
    case "weather":
      return WEATHERS;
    case "ride_frequency":
      return RIDE_FREQUENCIES;
    default:
      return [];
  }
}

function isStepNeeded() {
  return true;
}

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const visibleSteps = STEP_IDS.filter((id) => isStepNeeded(id, answers));
  const currentStepId = visibleSteps[stepIndex];

  const selectOption = (value) => {
    const nextAnswers = { ...answers, [currentStepId]: value };
    setAnswers(nextAnswers);

    const nextVisibleSteps = STEP_IDS.filter(() => isStepNeeded());
    if (stepIndex < nextVisibleSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      submitQuiz(nextAnswers);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    setError("");

    try {
      const res = await recommendationsApi.create({
        rider_type: finalAnswers.rider_type,
        terrain: finalAnswers.terrain,
        priority: finalAnswers.priority,
        tubeless: finalAnswers.tubeless,
        weather: finalAnswers.weather,
        ride_frequency: finalAnswers.ride_frequency,
      });

      setResult(res.data);
      localStorage.setItem("lastRecommendationId", res.data.recommendation_id);
      await syncPreferences(finalAnswers);
    } catch (err) {
      setError(err.message || "Impossible de générer une recommandation.");
    } finally {
      setSubmitting(false);
    }
  };

  const syncPreferences = async (finalAnswers) => {
    const user = getUser();
    if (!user?.id) return;

    try {
      const current = await profileApi.get(user.id);
      await profileApi.update(user.id, {
        preferences: {
          terrains: [finalAnswers.terrain],
          priorities: [finalAnswers.priority].filter(Boolean),
          weather_preferences: [finalAnswers.weather].filter(Boolean),
        },
      });
    } catch (err) {
      console.error("Erreur synchro préférences :", err.message);
    }
  };

  const restart = () => {
    setAnswers({});
    setStepIndex(0);
    setResult(null);
    setError("");
  };

  return (
    <section className="recommendation-page-content">
        <header className="recommendation-page-header">
          <h1>Trouver mon pneu Michelin</h1>
        </header>

        {result ? (
          <section className="recommendation-result">
            <div className={`recommendation-result-primary ${!(result.primary_tyre.pic1 || result.primary_tyre.pic2) ? "no-image" : ""}`}>
              {(result.primary_tyre.pic1 || result.primary_tyre.pic2) && (
                <div className="recommendation-result-visual has-image">
                  <div className="tyre-imgs">
                    <img
                      src={result.primary_tyre.pic1 || result.primary_tyre.pic2}
                      alt={result.primary_tyre.model}
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="recommendation-result-tag">Recommandation Michelin</span>
                <h2>{result.primary_tyre.model}</h2>

                <ul>
                  {(result.primary_tyre.reasons || []).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>

                <div className="recommendation-result-actions">
                  {result.primary_tyre.id && (
                    <button
                      className="recommendation-buy-btn"
                      onClick={() => navigate(`/catalogue/${result.primary_tyre.id}`)}
                    >
                      <Package size={18} />
                      Voir la fiche produit
                    </button>
                  )}

                  {result.primary_tyre.product_url && (
                    <a
                      href={result.primary_tyre.product_url}
                      target="_blank"
                      rel="noreferrer"
                      className="recommendation-buy-btn recommendation-buy-btn--outline"
                    >
                      Acheter en ligne
                      <ExternalLink size={18} />
                    </a>
                  )}

                  <button className="recommendation-restart-btn" onClick={restart}>
                    <RotateCcw size={18} />
                    Refaire le test
                  </button>
                </div>
              </div>
            </div>

            {result.alternatives?.length > 0 && (
              <div className="recommendation-alternatives">
                <h3>Autres pneus adaptés</h3>

                <div className="recommendation-alternatives-grid">
                  {result.alternatives.map((tyre) => (
                    <article key={tyre.model} className="recommendation-alt-card">
                      {(tyre.pic1 || tyre.pic2) && (
                        <div className="recommendation-alt-img-wrap">
                          <img src={tyre.pic || tyre.pic1} alt={tyre.model} />
                        </div>
                      )}
                      <strong>{tyre.model}</strong>
                      <span>{tyre.segment}</span>
                      {tyre.product_url && (
                        <a href={tyre.product_url} target="_blank" rel="noreferrer">
                          Voir le produit
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="recommendation-quiz">
            <div className="recommendation-progress">
              {visibleSteps.map((id, index) => (
                <div key={id} className={index <= stepIndex ? "done" : ""} />
              ))}
            </div>

            <h2>{STEP_TITLES[currentStepId]}</h2>

            {submitting ? (
              <p className="recommendation-loading">Recherche du pneu idéal...</p>
            ) : (
              <div className="recommendation-options">
                {getOptions(currentStepId).map((option) => (
                  <button
                    key={String(option.value)}
                    className={answers[currentStepId] === option.value ? "active" : ""}
                    onClick={() => selectOption(option.value)}
                  >
                    <strong>{option.label}</strong>
                    {option.hint && <span>{option.hint}</span>}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="recommendation-error">{error}</p>}

            <div className="recommendation-nav">
              {stepIndex > 0 && (
                <button className="recommendation-back-btn" onClick={goBack}>
                  <ArrowLeft size={18} />
                  Précédent
                </button>
              )}
            </div>
          </section>
        )}
    </section>
  );
}
