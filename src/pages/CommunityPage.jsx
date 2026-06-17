import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ThumbsUp,
  MessageSquare,
  Send,
  Trophy,
  Crown,
  Map,
  Mountain,
  Clock,
  Users,
} from "lucide-react";
import { communityApi } from "../services/api";
import "../styles/CommunityPage.css";

function formatDuration(seconds) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}` : `${minutes} min`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});

  useEffect(() => {
    Promise.allSettled([communityApi.getFeed(20), communityApi.leaderboard(5)]).then(
      ([feedRes, leaderboardRes]) => {
        if (feedRes.status === "fulfilled") setPosts(feedRes.value.data.items || []);
        if (leaderboardRes.status === "fulfilled") {
          setLeaderboard(leaderboardRes.value.data.items || []);
        }
        setLoading(false);
      }
    );
  }, []);

  const openActivity = (post) => {
    navigate(`/activites/${post.activity_id}`, {
      state: { author: { displayName: post.user.display_name, avatarUrl: post.user.avatar_url } },
    });
  };

  const toggleLike = async (post) => {
    try {
      const res = await communityApi.like(post.activity_id);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, likes_count: res.data.likes_count } : item
        )
      );
    } catch (error) {
      console.error("Erreur like :", error.message);
    }
  };

  const submitComment = async (post) => {
    const content = (commentDrafts[post.id] || "").trim();
    if (!content) return;

    try {
      await communityApi.comment(post.activity_id, content);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, comments_count: item.comments_count + 1 } : item
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
    } catch (error) {
      console.error("Erreur commentaire :", error.message);
    }
  };

  if (loading) {
    return <p className="community-loading">Chargement...</p>;
  }

  return (
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
              <h2>Fil d'actualités</h2>
              <span />
            </div>

            <div className="posts-list">
              {posts.length === 0 && (
                <p className="community-empty">
                  Pas encore de sortie dans la communauté. Sois le premier à partager un ride !
                </p>
              )}

              {posts.map((post) => (
                <article className="post-card" key={post.id}>
                  <div
                    className="post-top post-top-clickable"
                    onClick={() => openActivity(post)}
                  >
                    <div className="post-author">
                      <img
                        src={
                          post.user.avatar_url ||
                          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
                        }
                        alt={post.user.display_name}
                      />

                      <div>
                        <strong>{post.user.display_name}</strong>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>

                    {post.verified_michelin_review && (
                      <div className="verified-badge">Avis Vérifié Michelin</div>
                    )}
                  </div>

                  <div
                    className="post-stats-row post-stats-row-clickable"
                    onClick={() => openActivity(post)}
                  >
                    <span className="post-stat">
                      <Map size={18} />
                      <strong>{post.summary.distance_km ?? "—"} km</strong>
                      <small>Distance</small>
                    </span>

                    <span className="post-stat">
                      <Mountain size={18} />
                      <strong>{post.summary.elevation_m ?? "—"} m</strong>
                      <small>Dénivelé</small>
                    </span>

                    <span className="post-stat">
                      <Clock size={18} />
                      <strong>{formatDuration(post.summary.duration_seconds)}</strong>
                      <small>Durée</small>
                    </span>
                  </div>

                  <div className="post-tire">
                    <span>
                      {post.summary.tyre_name
                        ? `Pneu : ${post.summary.tyre_name}`
                        : "Pneu non renseigné"}
                    </span>
                  </div>

                  <div className="post-bottom">
                    <div className="post-reactions">
                      <span onClick={() => toggleLike(post)} role="button" tabIndex={0}>
                        <ThumbsUp size={18} />
                        {post.likes_count}
                      </span>

                      <span>
                        <MessageSquare size={18} />
                        {post.comments_count}
                      </span>
                    </div>

                    <form
                      className="comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitComment(post);
                      }}
                    >
                      <input
                        value={commentDrafts[post.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Écrire un commentaire..."
                      />
                      <button type="submit">
                        <Send size={16} />
                      </button>
                    </form>
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
              {leaderboard.length === 0 && (
                <p className="community-empty">Personne n'a encore roulé cette semaine.</p>
              )}

              {leaderboard.map((item) => (
                <div className="leaderboard-item" key={item.user_id}>
                  <span className="leaderboard-rank">{item.rank}</span>

                  <img
                    src={
                      item.avatar_url ||
                      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
                    }
                    alt={item.display_name}
                  />

                  <div>
                    <strong>{item.display_name}</strong>
                    <span>{item.distance_km} km</span>
                  </div>

                  {item.rank === 1 && <Crown className="crown-icon" size={28} />}
                </div>
              ))}
            </div>
          </aside>
        </section>
    </section>
  );
}
