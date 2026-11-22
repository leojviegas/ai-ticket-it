import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

  const cargarPerfil = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!perfil) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await usuarioService.obtenerPorId(organizadorId);
        setPerfil(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizadorId, perfil]
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

  return (
    <ScrollView
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
        <View
          style={[
            styles.grouped,
            {
              backgroundColor: colors.surface,
              boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
            },
          ]}
        >
          {perfil.eventosOrganizados.map((ev, index) => (
            <Pressable
              key={ev.id}
              onPress={() => router.push(`/evento/${ev.id}`)}
              style={({ pressed }) => [
                styles.eventRow,
                index > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline },
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <View style={styles.eventLeft}>
                <Text style={[styles.eventName, { color: colors.text }]}>{ev.nombre}</Text>
                <Text style={[styles.eventMeta, { color: colors.muted }]}>
                  {ev.categoria.nombre} · {formatDateShort(ev.fecha)}
                  {ev.yaOcurrio ? " · Finalizado" : ""}
                </Text>
              </View>

              <View style={styles.eventRight}>
                <View style={[styles.eventScorePill, { backgroundColor: colors.soft }]}>
                  <AppIcon name="star" size={12} color={colors.gold} />
                  <Text style={[styles.eventScoreText, { color: colors.text }]}>
                    {ev.cantidadReseniasEvento > 0 ? ev.puntajeEvento.toFixed(1) : "S/C"}
                  </Text>
                </View>
                <AppIcon name="chevron" size={18} color={colors.muted} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[styles.helperHint, { color: colors.muted }]}>
        Tocá cualquier evento para entrar a su detalle y consultar sus reseñas específicas.
      </Text>
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
  grouped: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  eventRow: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  eventLeft: { flex: 1, gap: 3 },
  eventName: { fontSize: 14, fontWeight: "800" },
  eventMeta: { fontSize: 12 },
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
});
