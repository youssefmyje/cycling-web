import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Bike } from "lucide-react";
import "../styles/AuthPage.css";
import { authApi } from "../services/api";

const API_URL = "http://localhost:5000/api/auth/login";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
  setLoading(true);

  try {
    const result = await authApi.login(formData.email, formData.password);

    const token = result.data?.access_token || result.access_token;
    const user = result.data?.user || result.user;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    navigate("/");
  } catch (err) {
    console.error(err);
    setError("Email ou mot de passe incorrect.");
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

          <h1>Connecte-toi à ton espace rider</h1>
          <p>
            Suis tes performances, tes pneus, tes rides et ta communauté depuis
            ton tableau de bord Michelin Riding.
          </p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>Connexion</h2>
          <p>Entre tes identifiants pour accéder à ton compte.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            <LogIn size={20} />
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="auth-switch">
          <span>Pas encore de compte ?</span>
          <button onClick={() => navigate("/register")}>
            Créer un compte
          </button>
        </div>
      </section>
    </main>
  );
}