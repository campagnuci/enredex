import { create } from "zustand";
import { api, setToken, type ApiError } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  homePlan: "free" | "premium";
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isPending: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isPending: true,

  async login(email, password) {
    const data = await api<{ user: User; accessToken: string }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );
    setToken(data.accessToken);
    set({ user: data.user, token: data.accessToken, isAuthenticated: true, isPending: false });
  },

  async register(name, email, password) {
    await api("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  },

  async logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    setToken(null);
    set({ user: null, token: null, isAuthenticated: false, isPending: false });
  },

  async refresh() {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setToken(data.accessToken);
      set({ token: data.accessToken, user: data.user, isAuthenticated: true, isPending: false });
    } catch {
      setToken(null);
      set({ user: null, token: null, isAuthenticated: false, isPending: false });
    }
  },

  async fetchMe() {
    try {
      const user = await api<User>("/api/users/me");
      if (user) set({ user, isAuthenticated: true, isPending: false });
      else {
        setToken(null);
        set({ isAuthenticated: false, isPending: false });
      }
    } catch {
      set({ isAuthenticated: false, isPending: false });
    }
  },
}));
