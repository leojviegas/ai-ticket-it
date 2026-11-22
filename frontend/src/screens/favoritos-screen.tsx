import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { EventCard } from "@/components/event-card";
import {
  EmptyView,
  ErrorView,
  GuestRequiredView,
  LoadingView,
} from "@/components/screen-state";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { ApiError } from "@/services/api";
import { usuarioService } from "@/services/usuario-service";
import { spacing } from "@/theme";
import type { Evento } from "@/types/api";
import { extractErrorMessage } from "@/utils/format";

export function FavoritosScreen() {
  const router = useRouter();
  const { colors } = usePreferences();
  const { user, favoritosIds, toggleFavorito, verifySession } = useAuth();

  const [favoritos, setFavoritos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [userId]);

  const cargarFavoritos = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const valid = await verifySession();
        if (!valid) {
          return;
        }
        const perfil = await usuarioService.obtenerPorId(userId);
        hasLoadedRef.current = true;
        setFavoritos(perfil.favoritos);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return;
        }
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, verifySession]
  );

  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos(false);
    }, [cargarFavoritos])
  );

  if (!user) {
    return (
      <GuestRequiredView
        title="Guardá tus eventos favoritos"
        description="Iniciá sesión para guardar espectáculos y volver rápido cuando quieras comprar."
      />
    );
  }

  if (loading && favoritos.length === 0) {
    return <LoadingView message="Cargando tus favoritos..." />;
  }

  if (error && favoritos.length === 0) {
    return <ErrorView message={error} onRetry={() => void cargarFavoritos(false)} />;
  }

  const handleToggle = async (eventoId: number) => {
    const prev = favoritos;
    setFavoritos((curr) => curr.filter((e) => e.id !== eventoId));
    try {
      await toggleFavorito(eventoId);
    } catch {
      setFavoritos(prev);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favoritos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarFavoritos(true)}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <EventCard
            evento={item}
            isFavorite={favoritosIds.includes(item.id)}
            onPress={() => router.push(`/evento/${item.id}`)}
            onToggleFavorite={() => void handleToggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyView
            icon="heart"
            title="Aún no tenés favoritos"
            description="Tocá el corazón en cualquier evento de Inicio para guardarlo acá."
            actionLabel="Explorar eventos"
            onAction={() => router.push("/(tabs)")}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
