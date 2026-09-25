import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle an expired/invalid session globally — redirect to login.
// Skipped for the login request itself (a wrong password is shown on the form)
// and for the startup session check (AuthContext handles it, so public pages
// aren't redirected when an old token is left in the browser).
const SKIP_REDIRECT = ["/auth/login", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !SKIP_REDIRECT.includes(error.config?.url)) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
