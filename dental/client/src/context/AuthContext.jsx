import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore the session from the httpOnly cookie (sent
  // automatically). A 401 just means no active session — stay anonymous.
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network/permission errors — clear local state regardless
    }
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook lives next to its provider
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
