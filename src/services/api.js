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

async function apiFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
  console.error("Erreur API complète :", data);

  let message = "Erreur API";

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