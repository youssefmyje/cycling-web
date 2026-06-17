const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const user = localStorage.getItem("user");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
  if (!options.silent) {
    console.error("Erreur API complète :", data);
  }

  let message;

  if (Array.isArray(data?.detail)) {
    message = data.detail
      .map((err) => {
        const field = err.loc?.join(".");
        return `${field} : ${err.msg}`;
      })
      .join(" | ");
  } else if (typeof data?.detail === "string") {
    message = data.detail;
  } else if (data?.message) {
    message = data.message;
  } else if (data?.error) {
    message = data.error;
  } else {
    message = JSON.stringify(data);
  }

  throw new Error(message);
}

  return data;
}

export const authApi = {
  login(email, password) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },

  register(firstName, lastName, email, password) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      }),
    });
  },

  me() {
    return apiFetch("/auth/me");
  },
};

export const profileApi = {
  get(userId) {
    return apiFetch(`/profiles/${userId}`);
  },

  update(userId, body) {
    return apiFetch(`/profiles/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  getBikes(userId) {
    return apiFetch(`/profiles/${userId}/bikes`);
  },

  addBike(userId, body) {
    return apiFetch(`/profiles/${userId}/bike`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  addMountedTyre(userId, body) {
    return apiFetch(`/profiles/${userId}/mounted-tyres`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export const activitiesApi = {
  create(body) {
    return apiFetch("/activities", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  list({ user_id, limit } = {}) {
    return apiFetch(`/activities${buildQuery({ user_id, limit })}`);
  },

  get(activityId) {
    return apiFetch(`/activities/${activityId}`);
  },

  update(activityId, body) {
    return apiFetch(`/activities/${activityId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  complete(activityId, body) {
    return apiFetch(`/activities/${activityId}/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getRoute(activityId) {
    return apiFetch(`/activities/${activityId}/route`, { silent: true });
  },

  importGpx(file, { bikeId, type, weather } = {}) {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch(
      `/activities/import/gpx${buildQuery({ bike_id: bikeId, type, weather })}`,
      {
        method: "POST",
        body: formData,
      }
    );
  },
};

export const progressApi = {
  summary() {
    return apiFetch("/progress/summary");
  },

  weekly() {
    return apiFetch("/progress/weekly");
  },

  tyreWear() {
    return apiFetch("/progress/tyre-wear");
  },
};

export const communityApi = {
  getFeed(limit = 20) {
    return apiFetch(`/feed${buildQuery({ limit })}`);
  },

  like(activityId) {
    return apiFetch(`/activities/${activityId}/like`, { method: "POST" });
  },

  comment(activityId, content) {
    return apiFetch(`/activities/${activityId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  getComments(activityId) {
    return apiFetch(`/activities/${activityId}/comments`);
  },

  leaderboard(limit = 10) {
    return apiFetch(`/leaderboard${buildQuery({ limit })}`);
  },
};

export const recommendationsApi = {
  create(body) {
    return apiFetch("/recommendations/tyres", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  get(recommendationId) {
    return apiFetch(`/recommendations/tyres/${recommendationId}`);
  },
};

export const challengesApi = {
  list() {
    return apiFetch("/challenges");
  },

  join(challengeId) {
    return apiFetch(`/challenges/${challengeId}/join`, { method: "POST" });
  },
};