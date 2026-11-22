import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { EmptyView, ErrorView, LoadingView } from "@/components/screen-state";
import { usePreferences } from "@/context/preferences-context";
import { usuarioService } from "@/services/usuario-service";
import { radius, shadows, spacing } from "@/theme";
import type { UsuarioPerfil } from "@/types/api";
import { extractErrorMessage, formatDateShort, getInitials } from "@/utils/format";

export function PerfilOrganizadorScreen({ organizadorId }: { organizadorId: number }) {
  const router = useRouter();
  const { colors, theme } = usePreferences();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [organizadorId]);

  const cargarPerfil = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await usuarioService.obtenerPorId(organizadorId);
        hasLoadedRef.current = true;
        setPerfil(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizadorId]
  );

  useFocusEffect(
    useCallback(() => {
      void cargarPerfil(false);
    }, [cargarPerfil])
  );

  if (loading && !perfil) {
    return <LoadingView message="Cargando perfil del organizador..." />;
  }

  if (error || !perfil) {
    return (
      <ErrorView
        message={error || "No pudimos encontrar este organizador."}
        onRetry={() => void cargarPerfil(false)}
      />
    );
  }

  const reseniasOrganizador =
    perfil.reseniasOrganizador ?? perfil.reseniasRecibidas ?? [];

  return (
    <ScrollView
      testID="organizer-profile-root"
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void cargarPerfil(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surface,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryText }]}>
            {getInitials(perfil.nombre, perfil.apellido)}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {perfil.nombre} {perfil.apellido}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {perfil.eventosOrganizados.length} eventos organizados (pasados y futuros)
          </Text>
          <View style={[styles.ratingPill, { backgroundColor: colors.soft }]}>
            <AppIcon name="star" size={14} color={colors.gold} />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {perfil.cantidadReseniasOrganizador > 0
                ? `${perfil.puntajeOrganizador.toFixed(2)} (${perfil.cantidadReseniasOrganizador} reseñas)`
                : "Sin reseñas aún"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Eventos del organizador
      </Text>

      {perfil.eventosOrganizados.length === 0 ? (
        <EmptyView
          icon="calendar"
          title="Sin eventos publicados"
          description="Este usuario todavía no organizó eventos."
        />
      ) : (
        <View style={styles.eventsList}>
          {perfil.eventosOrganizados.map((ev) => {
            const coverUri = ev.multimedia[0] ?? null;
            return (
              <Pressable
                key={ev.id}
                onPress={() => router.push(`/evento/${ev.id}`)}
                style={({ pressed }) => [
                  styles.eventCard,
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
                        {formatDateShort(ev.fecha)}
                        {ev.yaOcurrio ? " · Finalizado" : ""}
                      </Text>
                      <Text style={styles.bannerTitle} numberOfLines={1}>
                        {ev.nombre}
                      </Text>
                    </View>
                    <View style={styles.eventPill}>
                      <Text style={styles.eventPillText}>
                        {ev.yaOcurrio ? "Finalizado" : "Ver evento"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.footerMeta, { color: colors.muted }]}>
                    {ev.categoria.nombre}
                  </Text>
                  <View style={styles.eventRight}>
                    <View style={[styles.eventScorePill, { backgroundColor: colors.soft }]}>
                      <AppIcon name="star" size={12} color={colors.gold} />
                      <Text style={[styles.eventScoreText, { color: colors.text }]}>
                        {ev.cantidadReseniasEvento > 0 ? ev.puntajeEvento.toFixed(1) : "S/C"}
                      </Text>
                    </View>
                    <AppIcon name="chevron" size={18} color={colors.muted} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.helperHint, { color: colors.muted }]}>
        Tocá cualquier evento para entrar a su detalle y consultar sus reseñas específicas.
      </Text>

      <View testID="organizer-reviews-section" style={styles.reviewsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Experiencias previas con este organizador
        </Text>
        {reseniasOrganizador.length === 0 ? (
          <View style={[styles.emptyReviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyReviewText, { color: colors.muted }]}>
              Este organizador todavía no recibió reseñas en eventos anteriores.
            </Text>
          </View>
        ) : (
          reseniasOrganizador.map((rev) => (
            <View
              key={rev.id}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: colors.surface,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                },
              ]}
            >
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                    {rev.comprador.nombre} {rev.comprador.apellido}
                  </Text>
                  <Text style={[styles.reviewEvent, { color: colors.muted }]}>
                    {rev.eventoNombre}
                  </Text>
                </View>
                <View style={[styles.reviewScore, { backgroundColor: colors.soft }]}>
                  <AppIcon name="star" size={12} color={colors.gold} />
                  <Text style={[styles.reviewScoreText, { color: colors.text }]}>
                    {rev.puntuacion.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.reviewDetail, { color: colors.muted }]}>
                {rev.detalle}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800" },
  profileInfo: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: "800" },
  sub: { fontSize: 12 },
  ratingPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  eventsList: { gap: spacing.md },
  eventCard: {
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
  eventPill: {
    backgroundColor: "rgba(255,255,255,0.24)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  eventPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerMeta: { fontSize: 12, fontWeight: "600" },
  eventRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eventScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  eventScoreText: {
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  helperHint: { fontSize: 12, paddingHorizontal: spacing.xs },
  reviewsSection: { gap: spacing.sm, marginTop: spacing.xs },
  emptyReviewCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  emptyReviewText: { fontSize: 13, textAlign: "center" },
  reviewCard: {
    padding: 14,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    gap: spacing.xs,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: { fontSize: 13, fontWeight: "700" },
  reviewEvent: { fontSize: 11 },
  reviewScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  reviewScoreText: { fontSize: 12, fontWeight: "800" },
  reviewDetail: { fontSize: 13, lineHeight: 18 },
});
