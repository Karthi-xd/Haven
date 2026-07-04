import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try the refresh token once, then retry the original request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/login/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login/", { email, password });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export async function register(email: string, password: string, display_name = "") {
  const { data } = await api.post("/auth/register/", { email, password, display_name });
  return data;
}

/**
 * Turns an axios error into a single human-readable string.
 * - No `error.response` at all  -> the request never reached the server (backend down,
 *   wrong VITE_API_URL, CORS block, offline). We say so explicitly instead of guessing.
 * - `error.response.data` is DRF's validation shape ({ field: [...] } or { detail: "..." }
 *   or { non_field_errors: [...] }). We flatten whichever shape shows up.
 */
export function getErrorMessage(error: any, fallback: string): string {
  if (!error?.response) {
    return "Can't reach the server. Make sure the backend is running and try again.";
  }

  const data = error.response.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return Array.isArray(data.detail) ? data.detail.join(" ") : data.detail;

  const parts: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    if (field === "non_field_errors") parts.push(text);
    else parts.push(`${field}: ${text}`);
  }
  return parts.length ? parts.join(" ") : fallback;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me/");
  return data;
}

export async function updateProfile(profileData: { username?: string; display_name?: string; avatar_url?: string; bio?: string }) {
  const { data } = await api.patch("/auth/me/", profileData);
  return data;
}
