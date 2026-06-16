import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import {
  Home,
  Users,
  Activity,
  BarChart3,
  User,
  Settings,
  LogOut,
  Search,
  Bell,
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Trophy,
  Crown,
  Map,
  Mountain,
  Clock,
  Star,
} from "lucide-react";
import "../styles/CommunityPage.css";

const API_URL = "http://localhost:5000/api/community";

const defaultCommunityData = {
  user: {
    firstName: "Youssef",
    lastName: "M.",
    level: 28,
    avatarUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300",
  },

  posts: [
    {
      id: 1,
      authorName: "Julien D.",
      authorAvatar:
        "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300",
      date: "18 mai 2024 à 09:42",
      routeTitle: "Col du Granier",
      distance: "112,4 km",
      elevation: "2 045 m",
      duration: "4h 01m",
      tireUsed: "Michelin Power Cup",
      rating: 5,
      likes: 128,
      comments: 23,
      verified: true,
      mapImageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=700",
    },
    {
      id: 2,
      authorName: "Camille R.",
      authorAvatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300",
      date: "17 mai 2024 à 16:18",
      routeTitle: "Mont Ventoux",
      distance: "89,7 km",
      elevation: "1 910 m",
      duration: "3h 28m",
      tireUsed: "Michelin Power Cup",
      rating: 5,
      likes: 96,
      comments: 18,
      verified: false,
      mapImageUrl:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=700",
    },
    {
      id: 3,
      authorName: "Thomas L.",
      authorAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300",
      date: "16 mai 2024 à 07:55",
      routeTitle: "Gorges du Verdon",
      distance: "132,6 km",
      elevation: "2 432 m",
      duration: "5h 12m",
      tireUsed: "Michelin Power Cup",
      rating: 5,
      likes: 142,
      comments: 31,
      verified: false,
      mapImageUrl:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=700",
    },
  ],

  leaderboard: [
    {
      id: 1,
      name: "Alexis B.",
      distance: "732,5 km",
      avatarUrl:
        "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300",
    },
    {
      id: 2,
      name: "Léa M.",
      distance: "598,3 km",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300",
    },
    {
      id: 3,
      name: "Nicolas P.",
      distance: "541,7 km",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300",
    },
    {
      id: 4,
      name: "Mathieu G.",
      distance: "487,2 km",
      avatarUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300",
    },
    {
      id: 5,
      name: "Chloé T.",
      distance: "451,9 km",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
    },
  ],
};

export default function CommunityPage() {
  const navigate = useNavigate();

  const [communityData, setCommunityData] = useState(defaultCommunityData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityData();
  }, []);

  const getCommunityData = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Backend non disponible");
      }

      const data = await response.json();

      setCommunityData({
        user: {
          firstName: data.user?.firstName || defaultCommunityData.user.firstName,
          lastName: data.user?.lastName || defaultCommunityData.user.lastName,
          level: data.user?.level ?? defaultCommunityData.user.level,
          avatarUrl:
            data.user?.avatarUrl || defaultCommunityData.user.avatarUrl,
        },

        posts: data.posts?.length ? data.posts : defaultCommunityData.posts,

        leaderboard: data.leaderboard?.length
          ? data.leaderboard
          : defaultCommunityData.leaderboard,
      });
    } catch (error) {
      console.warn("Données temporaires utilisées :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = Math.round(Number(rating) || 0);

    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        fill={index < stars ? "#FFE600" : "transparent"}
        color={index < stars ? "#FFE600" : "#777"}
      />
    ));
  };

  if (loading) {
    return (
      <main className="community-page">
        <p className="community-loading">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="community-page">
      <aside className="community-sidebar">
        <div className="community-logo">
          <span className="community-logo-m">M</span>
          <span className="community-logo-text">MICHELIN</span>
          <span className="community-logo-subtitle">RIDING</span>
        </div>

        <nav className="community-menu">
          <button onClick={() => navigate("/")}>
            <Home size={24} />
            Accueil
          </button>

          <button className="active">
            <Users size={24} />
            Communauté
          </button>

          <button onClick={() => navigate("/progres")}>
            <BarChart3 size={24} />
            Activité
          </button>

          <button onClick={() => navigate("/profil")}>
            <User size={24} />
            Mon Profil
          </button>

          <button>
            <Settings size={24} />
            Paramètres
          </button>
        </nav>

        <div className="community-user-box">
          <img src={communityData.user.avatarUrl} alt="Utilisateur" />

          <div>
            <strong>
              {communityData.user.firstName} {communityData.user.lastName}
            </strong>
            <span>Niveau {communityData.user.level}</span>
          </div>
        </div>

        <button
  className="home-logout"
  onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }}
>
  <LogOut size={22} />
  Déconnexion
</button>
      </aside>

      <section className="community-content">
        <header className="community-header">
          <div className="community-title">
            <Users size={34} />
            <h1>Communauté</h1>
          </div>

          <div className="community-actions">
            <button>
              <Search size={24} />
            </button>

            <button>
              <Bell size={24} />
              <span />
            </button>
          </div>
        </header>

        <section className="community-grid">
          <section className="feed-section">
            <div className="feed-title">
              <h2>Fil d’actualités</h2>
              <span />
            </div>

            <div className="posts-list">
              {communityData.posts.map((post) => (
                <article className="post-card" key={post.id}>
                  <div className="post-top">
                    <div className="post-author">
                      <img src={post.authorAvatar} alt={post.authorName} />

                      <div>
                        <strong>{post.authorName}</strong>
                        <span>{post.date}</span>
                      </div>
                    </div>

                    {post.verified && (
                      <div className="verified-badge">
                        Avis Vérifié Michelin
                      </div>
                    )}
                  </div>

                  <div className="post-main">
                    <div className="post-info">
                      <h3>{post.routeTitle}</h3>

                      <div className="post-stats">
                        <span>
                          <Map size={16} />
                          {post.distance}
                          <small>Distance</small>
                        </span>

                        <span>
                          <Mountain size={16} />
                          {post.elevation}
                          <small>Dénivelé</small>
                        </span>

                        <span>
                          <Clock size={16} />
                          {post.duration}
                          <small>Durée</small>
                        </span>
                      </div>

                      <div className="post-tire">
                        <span>Pneu : {post.tireUsed}</span>
                        <div>{renderStars(post.rating)}</div>
                      </div>
                    </div>

                    <div className="post-map">
                      <img src={post.mapImageUrl} alt={post.routeTitle} />
                      <div className="route-line" />
                    </div>
                  </div>

                  <div className="post-bottom">
                    <div className="post-reactions">
                      <span>
                        <ThumbsUp size={18} />
                        {post.likes}
                      </span>

                      <span>
                        <MessageSquare size={18} />
                        {post.comments}
                      </span>
                    </div>

                    <button>
                      <MoreHorizontal size={22} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="leaderboard-card">
            <div className="leaderboard-title">
              <h2>Leaderboard Hebdo</h2>
              <Trophy size={24} />
            </div>

            <div className="leaderboard-list">
              {communityData.leaderboard.map((item, index) => (
                <div className="leaderboard-item" key={item.id}>
                  <span className="leaderboard-rank">{index + 1}</span>

                  <img src={item.avatarUrl} alt={item.name} />

                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.distance}</span>
                  </div>

                  {index === 0 && <Crown className="crown-icon" size={28} />}
                </div>
              ))}
            </div>

            <button className="ranking-button">
              Voir le classement complet
              <span>›</span>
            </button>
          </aside>
        </section>
      </section>
    </main>
  );
}