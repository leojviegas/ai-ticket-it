import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { setApiAuthToken } from "@/services/api";
import { authService } from "@/services/auth-service";
import { usuarioService } from "@/services/usuario-service";
import type { Usuario } from "@/types/api";

const AUTH_STORAGE_KEY = "ai_ticket_it_token_v1";

interface AuthContextValue {
  token: string | null;
  user: Usuario | null;
  favoritosIds: number[];
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  register: (datos: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }) => Promise<Usuario>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  toggleFavorito: (eventoId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const persistSession = useCallback(async (newToken: string | null, newUser: Usuario | null) => {
    setApiAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, newToken).catch(() => {});
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then(async (savedToken) => {
        if (!active || !savedToken) {
          return;
        }
        setApiAuthToken(savedToken);
        try {
          const me = await authService.me(savedToken);
          if (active) {
            setToken(savedToken);
            setUser(me);
          }
        } catch {
          // Si el backend en memoria se reinició o el token expiró, volvemos a invitado limpio
          if (active) {
            await persistSession(null, null);
          }
        }
      })
      .finally(() => {
        if (active) {
          setIsHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, [persistSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      await persistSession(res.accessToken, res.usuario);
      return res.usuario;
    },
    [persistSession]
  );

  const register = useCallback(
    async (datos: { nombre: string; apellido: string; email: string; password: string }) => {
      const res = await authService.register(datos);
      await persistSession(res.accessToken, res.usuario);
      return res.usuario;
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    await persistSession(null, null);
  }, [persistSession]);

  const refreshMe = useCallback(async () => {
    if (!token) {
      return;
    }
    const me = await authService.me(token);
    setUser(me);
  }, [token]);

  const toggleFavorito = useCallback(
    async (eventoId: number): Promise<boolean> => {
      if (!user) {
        return false;
      }
      const prevIds = user.favoritosIds ?? [];
      const alreadyFav = prevIds.includes(eventoId);
      const optimisticIds = alreadyFav
        ? prevIds.filter((id) => id !== eventoId)
        : [...prevIds, eventoId];

      setUser((curr) => (curr ? { ...curr, favoritosIds: optimisticIds } : curr));
      try {
        const result = await usuarioService.toggleFavorito(user.id, eventoId);
        setUser((curr) =>
          curr ? { ...curr, favoritosIds: result.favoritosIds } : curr
        );
        return result.esFavorito;
      } catch (err) {
        setUser((curr) => (curr ? { ...curr, favoritosIds: prevIds } : curr));
        throw err;
      }
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      favoritosIds: user?.favoritosIds ?? [],
      isHydrated,
      login,
      register,
      logout,
      refreshMe,
      toggleFavorito,
    }),
    [token, user, isHydrated, login, register, logout, refreshMe, toggleFavorito]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
