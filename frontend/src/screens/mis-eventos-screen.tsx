import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
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
import { radius, shadows, spacing } from "@/theme";
import type { Evento } from "@/types/api";
import { extractErrorMessage, formatDateShort } from "@/utils/format";

export function MisEventosScreen() {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user, verifySession } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [userId]);

  const cargarEventosPropios = useCallback(
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
        setEventos(perfil.eventosOrganizados);
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
      void cargarEventosPropios(false);
    }, [cargarEventosPropios])
  );

  if (!user) {
    return (
      <GuestRequiredView
        title="Administrá tus eventos"
        description="Iniciá sesión para publicar espectáculos, definir tipos de entrada y gestionar las compras recibidas."
      />
    );
  }

  if (loading && eventos.length === 0) {
    return <LoadingView message="Cargando tus eventos..." />;
  }

  if (error && eventos.length === 0) {
    return (
      <ErrorView message={error} onRetry={() => void cargarEventosPropios(false)} />
    );
  }

  if (eventos.length === 0) {
    return (
      <View style={[styles.emptyRoot, { backgroundColor: colors.background }]}>
        <EmptyView
          icon="calendar"
          title="Todavía no creaste tu primer evento"
          description="Para empezar a organizar algún evento, creá uno definiendo su fecha, tipos de entrada y cupos."
          actionLabel="Crear mi primer evento"
          actionTestID="create-event-btn"
          onAction={() => router.push("/crear-evento")}
          secondaryNote="Si no tenés pensado crear eventos futuros, podés deshabilitar este botón en Perfil → Opciones."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={eventos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarEventosPropios(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Pressable
              testID="create-event-btn"
              onPress={() => router.push("/crear-evento")}
              style={({ pressed }) => [
                styles.createBtn,
                {
                  backgroundColor: colors.primary,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.raised,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <AppIcon name="plus" size={18} color={colors.primaryText} />
              <Text style={[styles.createBtnText, { color: colors.primaryText }]}>
                Publicar nuevo evento
              </Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tus eventos publicados ({eventos.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const coverUri = item.multimedia[0] ?? null;
          const totalCupo = item.tiposEntrada.reduce((acc, t) => acc + t.cupo, 0);

          return (
            <Pressable
              onPress={() => router.push(`/gestionar-evento/${item.id}`)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={[styles.banner, { backgroundColor: colors.primary }]}>
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={styles.bannerImg}
                    contentFit="cover"
                  />
                ) : null}
                <View style={styles.bannerScrim} />
                <View style={styles.bannerOverlay}>
                  <View style={styles.bannerInfo}>
                    <Text style={styles.bannerDate}>
                      {formatDateShort(item.fecha)}
                      {item.yaOcurrio ? " · Finalizado" : ""}
                    </Text>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                  </View>
                  <View style={styles.managePill}>
                    <Text style={styles.managePillText}>Gestionar</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.footerMeta, { color: colors.muted }]}>
                  {item.categoria.nombre} · {item.tiposEntrada.length} tipos · {totalCupo} disp.
                </Text>
                <View style={styles.scoreRow}>
                  <AppIcon name="star" size={13} color={colors.gold} />
                  <Text style={[styles.scoreText, { color: colors.text }]}>
                    {item.cantidadReseniasEvento > 0
                      ? item.puntajeEvento.toFixed(1)
                      : "S/C"}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyRoot: { flex: 1, justifyContent: "center" },
  container: { flex: 1 },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: { gap: spacing.md },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  createBtnText: { fontSize: 14, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  card: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  banner: {
    height: 100,
    position: "relative",
    justifyContent: "flex-end",
    padding: 14,
  },
  bannerImg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 22, 36, 0.56)",
  },
  bannerOverlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
    zIndex: 2,
  },
  bannerInfo: { flex: 1, gap: 2 },
  bannerDate: { color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: "600" },
  bannerTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  managePill: {
    backgroundColor: "rgba(255,255,255,0.24)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  managePillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerMeta: { fontSize: 12, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreText: { fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] },
});
