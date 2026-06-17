import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ThumbsUp,
  MessageSquare,
  Send,
  Trophy,
  Map,
  Mountain,
  Clock,
  Users,
  CalendarDays,
  Route,
  ExternalLink,
} from "lucide-react";
import { communityApi, eventsApi, challengesApi } from "../services/api";
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

const EVENT_PHOTOS = {
  "Cyclosportive": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=80",
  "Gran Fondo":    "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=600&q=80",
  "VTT / Gravel":  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "Randonnée":     "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&q=80",
};
const EVENT_FALLBACK = "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=80";

const TABS = ["FEED", "EVENTS", "CHALLENGE"];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("FEED");

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([communityApi.getFeed(20), communityApi.leaderboard(5)]).then(
      ([feedRes, leaderboardRes]) => {
        if (feedRes.status === "fulfilled") setPosts(feedRes.value.data.items || []);
        if (leaderboardRes.status === "fulfilled") setLeaderboard(leaderboardRes.value.data.items || []);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (activeTab === "EVENTS" && events.length === 0) {
      setEventsLoading(true);
      eventsApi.list()
        .then((res) => setEvents(res.data || []))
        .catch(() => {})
        .finally(() => setEventsLoading(false));
    }
    if (activeTab === "CHALLENGE" && challenges.length === 0) {
      setChallengesLoading(true);
      challengesApi.list()
        .then((res) => setChallenges(res.data.items || []))
        .catch(() => {})
        .finally(() => setChallengesLoading(false));
    }
  }, [activeTab]);

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

  return (
    <section className="community-content">
      <header className="community-header">
        <div className="community-title">
          <h1>Communauté</h1>
        </div>
        <div className="community-actions">
        </div>
      </header>

      <div className="community-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`community-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="community-grid">
        {/* ─── FEED ─── */}
        {activeTab === "FEED" && (
          <>
            <section className="feed-section">
              {loading ? (
                <p className="community-loading">Chargement...</p>
              ) : (
                <div className="posts-list">
                  {posts.length === 0 && (
                    <p className="community-empty">
                      Pas encore de sortie dans la communauté. Sois le premier à partager un ride !
                    </p>
                  )}
                  {posts.map((post) => (
                    <article className="post-card" key={post.id}>
                      <div className="post-top post-top-clickable" onClick={() => openActivity(post)}>
                        <div className="post-author">
                          <img
                            src={post.user.avatar_url || "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"}
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

                      <div className="post-stats-row post-stats-row-clickable" onClick={() => openActivity(post)}>
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

                      <div
                        className={`post-tire${post.summary.tyre_catalogue_id ? " post-tire-clickable" : ""}`}
                        onClick={() => post.summary.tyre_catalogue_id && navigate(`/catalogue/${post.summary.tyre_catalogue_id}`)}
                      >
                        <span>
                          {post.summary.tyre_name
                            ? `Pneu : ${post.summary.tyre_name}`
                            : "Pneu non renseigné"}
                        </span>
                        {post.summary.tyre_catalogue_id && (
                          <span className="post-tire-arrow">→</span>
                        )}
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
                          onSubmit={(e) => { e.preventDefault(); submitComment(post); }}
                        >
                          <input
                            value={commentDrafts[post.id] || ""}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Écrire un commentaire..."
                          />
                          <button type="submit"><Send size={16} /></button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="leaderboard-card">
              <div className="leaderboard-title">
                <h2>Leaderboard Hebdo</h2>
                <Trophy size={22} />
              </div>

              {leaderboard.length === 0 ? (
                <p className="community-empty">Personne n'a encore roulé cette semaine.</p>
              ) : (
                <>
                  {/* Podium top 3 */}
                  <div className="leaderboard-podium">
                    {[1, 0, 2].map((idx) => {
                      const item = leaderboard[idx];
                      if (!item) return <div key={idx} />;
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div key={item.user_id} className={`podium-slot rank-${item.rank}`}>
                          <span className="podium-medal">{medals[item.rank - 1]}</span>
                          <img
                            src={item.avatar_url || "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"}
                            alt={item.display_name}
                          />
                          <span className="podium-name">{item.display_name}</span>
                          <span className="podium-km">{item.distance_km} km</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reste du classement */}
                  {leaderboard.length > 3 && (
                    <div className="leaderboard-rest">
                      {leaderboard.slice(3).map((item) => (
                        <div className="leaderboard-rest-item" key={item.user_id}>
                          <span className="leaderboard-rest-rank">{item.rank}</span>
                          <img
                            src={item.avatar_url || "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"}
                            alt={item.display_name}
                          />
                          <strong>{item.display_name}</strong>
                          <span>{item.distance_km} km</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </aside>
          </>
        )}

        {/* ─── EVENTS ─── */}
        {activeTab === "EVENTS" && (
          <section className="events-section">
            {eventsLoading ? (
              <p className="community-loading">Chargement des événements...</p>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className="event-card-img">
                      <img
                        src={EVENT_PHOTOS[event.category] || EVENT_FALLBACK}
                        alt={event.title}
                      />
                      <span className="event-category-badge">{event.category}</span>
                    </div>
                    <div className="event-card-body">
                      <div className="event-card-header">
                        <h3>{event.title}</h3>
                        <div className="event-date">
                          <CalendarDays size={14} />
                          {event.date_start}
                          {event.date_end !== event.date_start && ` → ${event.date_end}`}
                        </div>
                      </div>

                      <p className="event-description">{event.description}</p>

                      <div className="event-stats">
                        <span>
                          <Route size={14} />
                          {event.distance_km} km
                        </span>
                        <span>
                          <Mountain size={14} />
                          {event.elevation_m.toLocaleString("fr-FR")} m D+
                        </span>
                        <span>
                          <Map size={14} />
                          {event.location}, {event.region}
                        </span>
                      </div>

                      {event.website && (
                        <a
                          href={event.website}
                          target="_blank"
                          rel="noreferrer"
                          className="event-website-btn"
                        >
                          Site officiel
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── CHALLENGE ─── */}
        {activeTab === "CHALLENGE" && (
          <section className="challenges-section">
            {challengesLoading ? (
              <p className="community-loading">Chargement des challenges...</p>
            ) : challenges.length === 0 ? (
              <p className="community-empty">Aucun challenge actif pour le moment.</p>
            ) : (
              <div className="challenges-column">
                {challenges.map((c) => (
                  <article className="challenge-community-card" key={c.id}>
                    <div className="challenge-community-icon">
                      <Route size={32} />
                    </div>
                    <div className="challenge-community-info">
                      <h3>{c.title}</h3>
                      <p>{c.description}</p>
                      <div className="challenge-community-meta">
                        <span className="challenge-goal-badge">
                          {c.goal_value} {c.goal_type === "rides_count" ? "sorties" : c.goal_type === "elevation_m" ? "m D+" : "km"}
                        </span>
                        {c.joined && <span className="challenge-joined-badge">Inscrit ✓</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </section>
  );
}
