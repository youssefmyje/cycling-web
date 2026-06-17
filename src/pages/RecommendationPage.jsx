import { useState } from "react";
import { ArrowLeft, CircleDot, RotateCcw, ExternalLink } from "lucide-react";
import { getUser, profileApi, recommendationsApi } from "../services/api";
import "../styles/RecommendationPage.css";

const BIKE_TYPES = [
  { value: "road", label: "Route" },
  { value: "gravel", label: "Gravel" },
  { value: "mtb", label: "VTT" },
  { value: "city", label: "Urbain / Trekking" },
  { value: "ebike", label: "E-bike" },
];

const RIDING_STYLES_BY_BIKE = {
  road: [
    { value: "racing", label: "Compétition / course" },
    { value: "endurance", label: "Endurance / longue distance" },
  ],
  gravel: [
    { value: "endurance", label: "Endurance" },
    { value: "all_road", label: "Tout-terrain mixte" },
    { value: "touring", label: "Voyage / bikepacking" },
  ],
  mtb: [
    { value: "cross_country", label: "Cross-country" },
    { value: "trail", label: "Trail" },
    { value: "enduro", label: "Enduro" },
    { value: "downhill", label: "Descente" },
  ],
  city: [
    { value: "urban", label: "Urbain quotidien" },
    { value: "trekking", label: "Trekking urbain" },
    { value: "touring", label: "Voyage" },
  ],
  ebike: [
    { value: "endurance", label: "Endurance" },
    { value: "all_road", label: "Tout-terrain mixte" },
    { value: "trekking", label: "Trekking" },
    { value: "urban", label: "Urbain" },
    { value: "trail", label: "Trail" },
  ],
};

const TERRAINS_BY_BIKE = {
  road: [{ value: "asphalt", label: "Bitume" }],
  gravel: [
    { value: "asphalt", label: "Bitume" },
    { value: "mixed", label: "Mixte" },
    { value: "offroad_hard", label: "Chemin compact" },
  ],
  mtb: [
    { value: "offroad_hard", label: "Chemin compact, sec" },
    { value: "offroad_mixed", label: "Mixte, racines / rochers" },
    { value: "offroad_soft", label: "Boue / sable" },
  ],
  city: [
    { value: "asphalt", label: "Bitume" },
    { value: "mixed", label: "Mixte" },
  ],
  ebike: [
    { value: "asphalt", label: "Bitume" },
    { value: "mixed", label: "Mixte" },
    { value: "offroad_hard", label: "Chemin compact" },
    { value: "offroad_mixed", label: "Mixte engagé" },
  ],
};

const BUDGET_LEVELS = [
  { value: "racing", label: "Racing", hint: "Le haut de gamme, pour la compétition" },
  { value: "competition", label: "Compétition", hint: "Haute performance, riders exigeants" },
  { value: "performance", label: "Performance", hint: "Bon compromis, pratique régulière" },
  { value: "access", label: "Access", hint: "Entrée de gamme, usage occasionnel" },
];

const TUBELESS_OPTIONS = [
  { value: true, label: "Tubeless Ready" },
  { value: false, label: "Chambre à air" },
];

const EBIKE_OPTIONS = [
  { value: false, label: "Vélo classique" },
  { value: true, label: "E-bike" },
];

const STEP_IDS = ["bike_type", "riding_style", "terrain", "budget_level", "tubeless", "e_bike"];

const STEP_TITLES = {
  bike_type: "Quel type de vélo roules-tu ?",
  riding_style: "Quel est ton style de pratique ?",
  terrain: "Sur quel terrain roules-tu le plus ?",
  budget_level: "Quel niveau de gamme recherches-tu ?",
  tubeless: "Quel montage utilises-tu ?",
  e_bike: "Roules-tu en e-bike ?",
};

function getOptions(stepId, answers) {
  switch (stepId) {
    case "bike_type":
      return BIKE_TYPES;
    case "riding_style":
      return RIDING_STYLES_BY_BIKE[answers.bike_type] || [];
    case "terrain":
      return TERRAINS_BY_BIKE[answers.bike_type] || [];
    case "budget_level":
      return BUDGET_LEVELS;
    case "tubeless":
      return TUBELESS_OPTIONS;
    case "e_bike":
      return EBIKE_OPTIONS;
    default:
      return [];
  }
}

function isStepNeeded(stepId, answers) {
  if (stepId === "terrain") return getOptions("terrain", answers).length > 1;
  if (stepId === "e_bike") return answers.bike_type !== "ebike";
  return true;
}

export default function RecommendationPage() {
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const visibleSteps = STEP_IDS.filter((id) => isStepNeeded(id, answers));
  const currentStepId = visibleSteps[stepIndex];

  const selectOption = (value) => {
    const nextAnswers = { ...answers, [currentStepId]: value };

    if (currentStepId === "bike_type") {
      delete nextAnswers.riding_style;
      delete nextAnswers.terrain;
      if (value === "ebike") nextAnswers.e_bike = true;
    }

    setAnswers(nextAnswers);

    const nextVisibleSteps = STEP_IDS.filter((id) => isStepNeeded(id, nextAnswers));
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
        bike_type: finalAnswers.bike_type,
        riding_style: finalAnswers.riding_style,
        terrain: finalAnswers.terrain || getOptions("terrain", finalAnswers)[0]?.value,
        budget_level: finalAnswers.budget_level,
        tubeless: finalAnswers.tubeless,
        e_bike: Boolean(finalAnswers.e_bike),
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
          terrains: [finalAnswers.bike_type],
          priorities: [finalAnswers.riding_style, finalAnswers.budget_level].filter(Boolean),
          weather_preferences: current.data?.preferences?.weather_preferences || [],
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
            <div className="recommendation-result-primary">
              <div className="recommendation-result-visual">
                <CircleDot size={96} color="#FFE600" />
              </div>

              <div>
                <span className="recommendation-result-tag">Recommandation Michelin</span>
                <h2>{result.primary_tyre.model}</h2>

                <ul>
                  {(result.primary_tyre.reasons || []).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>

                <div className="recommendation-result-actions">
                  {result.primary_tyre.product_url && (
                    <a
                      href={result.primary_tyre.product_url}
                      target="_blank"
                      rel="noreferrer"
                      className="recommendation-buy-btn"
                    >
                      Voir le produit
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
                      <CircleDot size={36} color="#FFE600" />
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
                {getOptions(currentStepId, answers).map((option) => (
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
