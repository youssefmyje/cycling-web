import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Bike, UserPlus } from "lucide-react";
import "../styles/AuthPage.css";
import { authApi } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 const handleSubmit = async (event) => {
  event.preventDefault();
  setError("");

  if (formData.password.length < 6) {
    setError("Le mot de passe doit contenir au moins 6 caractères.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Les mots de passe ne correspondent pas.");
    return;
  }

  setLoading(true);

  try {
    const result = await authApi.register(
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password
    );

    console.log("Réponse register :", result);

    const token =
      result.data?.access_token ||
      result.access_token ||
      result.token;

    const user =
      result.data?.user ||
      result.user;

    if (!token) {
      throw new Error("Token manquant dans la réponse backend.");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    navigate("/");
  } catch (err) {
    console.error("Erreur création compte :", err);
    setError(err.message || "Impossible de créer le compte.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="auth-page">
      <section className="auth-left">
        <div className="auth-logo">
          <span className="auth-logo-m">M</span>
          <span className="auth-logo-text">MICHELIN</span>
          <span className="auth-logo-subtitle">RIDING</span>
        </div>

        <div className="auth-hero">
          <div className="auth-icon-circle">
            <Bike size={58} />
          </div>

          <h1>Rejoins la communauté Michelin Riding</h1>
          <p>
            Crée ton compte pour suivre tes sorties, tes performances, tes pneus
            et rejoindre le classement des riders.
          </p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>Créer un compte</h2>
          <p>Renseigne tes informations pour commencer.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-two-columns">
            <label>
              Prénom
              <div className="auth-input-wrapper">
                <User size={20} />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Youssef"
                  required
                />
              </div>
            </label>

            <label>
              Nom
              <div className="auth-input-wrapper">
                <User size={20} />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="M."
                  required
                />
              </div>
            </label>
          </div>

          <label>
            Adresse e-mail
            <div className="auth-input-wrapper">
              <Mail size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="exemple@email.com"
                required
              />
            </div>
          </label>

          <label>
            Mot de passe
            <div className="auth-input-wrapper">
              <Lock size={20} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimum 6 caractères"
                required
              />
            </div>
          </label>

          <label>
            Confirmer le mot de passe
            <div className="auth-input-wrapper">
              <Lock size={20} />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                placeholder="Confirme ton mot de passe"
                required
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            <UserPlus size={20} />
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div className="auth-switch">
          <span>Déjà un compte ?</span>
          <button onClick={() => navigate("/login")}>Se connecter</button>
        </div>
      </section>
    </main>
  );
}