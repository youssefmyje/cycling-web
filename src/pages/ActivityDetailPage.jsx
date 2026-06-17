import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Send,
  Map as MapIcon,
  Mountain,
  Clock,
  Gauge,
  CalendarDays,
} from "lucide-react";
import { getUser, activitiesApi, communityApi } from "../services/api";
import RouteMap from "../components/RouteMap";
import "../styles/ActivityDetailPage.css";

const TYPE_LABELS = { route: "Route", gravel: "Gravel", mtb: "VTT", urban: "Urbain" };
const WEATHER_LABELS = { dry: "Sec", wet: "Humide", mixed: "Mitigé" };

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const [activity, setActivity] = useState(null);
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const author = location.state?.author || {
    displayName: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    avatarUrl: null,
  };

  useEffect(() => {
    if (!activityId) return;

    Promise.allSettled([
      activitiesApi.get(activityId),
      communityApi.getComments(activityId),
    ]).then(([activityRes, commentsRes]) => {
      if (activityRes.status === "fulfilled") setActivity(activityRes.value.data);
      if (commentsRes.status === "fulfilled") setComments(commentsRes.value.data.items || []);
      setLoading(false);
    });
  }, [activityId]);

  const toggleLike = async () => {
    try {
      const res = await communityApi.like(activityId);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (error) {
      console.error("Erreur like :", error.message);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const content = commentDraft.trim();
    if (!content) return;

    try {
      await communityApi.comment(activityId, content);
      setCommentDraft("");
      const res = await communityApi.getComments(activityId);
      setComments(res.data.items || []);
    } catch (error) {
      console.error("Erreur commentaire :", error.message);
    }
  };

  if (loading) {
    return <p className="loading-text">Chargement...</p>;
  }

  if (!activity) {
    return <p className="loading-text">Sortie introuvable.</p>;
  }

  return (
    <section className="activity-detail-content">
      <button className="activity-detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Retour
      </button>

      <div className="activity-detail-card">
        <div className="activity-detail-header">
          <img
            src={
              author.avatarUrl ||
              "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
            }
            alt={author.displayName}
          />

          <div>
            <strong>{author.displayName || "Rider"}</strong>
            <span>
              <CalendarDays size={14} />
              {formatDate(activity.started_at)}
            </span>
          </div>
        </div>

        <RouteMap key={activityId} activityId={activityId} height={320} />

        <div className="activity-detail-stats">
          <div>
            <Gauge size={26} />
            <strong>{activity.distance_km ?? "—"} km</strong>
            <span>Distance</span>
          </div>

          <div>
            <Mountain size={26} />
            <strong>{activity.elevation_m ?? "—"} m</strong>
            <span>Dénivelé</span>
          </div>

          <div>
            <Clock size={26} />
            <strong>{formatDuration(activity.duration_seconds)}</strong>
            <span>Durée</span>
          </div>

          <div>
            <MapIcon size={26} />
            <strong>{TYPE_LABELS[activity.type] || activity.type}</strong>
            <span>Terrain</span>
          </div>
        </div>

        {activity.weather && (
          <p className="activity-detail-weather">
            Météo : {WEATHER_LABELS[activity.weather] || activity.weather}
          </p>
        )}

        <div className="activity-detail-actions">
          <button className={liked ? "active" : ""} onClick={toggleLike}>
            <ThumbsUp size={18} />
            {likesCount ?? "J'aime"}
          </button>

          <span className="activity-detail-comment-count">
            <MessageSquare size={18} />
            {comments.length} commentaire{comments.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="activity-detail-comments">
        <h2>Commentaires</h2>

        <form className="activity-detail-comment-form" onSubmit={submitComment}>
          <input
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Écrire un commentaire..."
          />
          <button type="submit">
            <Send size={16} />
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="activity-detail-empty">Aucun commentaire pour le moment.</p>
        ) : (
          <div className="activity-detail-comments-list">
            {comments.map((comment) => (
              <div className="activity-detail-comment" key={comment.id}>
                <img
                  src={
                    comment.avatar_url ||
                    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=300"
                  }
                  alt={comment.display_name}
                />
                <div>
                  <strong>{comment.display_name}</strong>
                  <p>{comment.content}</p>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
