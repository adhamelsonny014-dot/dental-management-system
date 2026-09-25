import axios from "axios";

// The session token lives in an httpOnly cookie set by the server, so it is
// never exposed to page scripts. `withCredentials` sends that cookie with
// every request; there is no token in localStorage to read or attach.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Handle an expired/invalid session globally — redirect to login.
// Skipped for the login request itself (a wrong password is shown on the form)
// and for the startup session check (AuthContext handles it, so public pages
// aren't redirected for an anonymous visitor).
const SKIP_REDIRECT = ["/auth/login", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !SKIP_REDIRECT.includes(error.config?.url)) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
