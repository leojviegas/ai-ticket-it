import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { EmptyView, GuestRequiredView, LoadingView } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/context/auth-context";
import { useMessaging } from "@/context/messaging-context";
import { usePreferences } from "@/context/preferences-context";
import { radius, shadows, spacing } from "@/theme";
import type { Conversacion } from "@/types/api";
import { formatDateShort, getInitials } from "@/utils/format";

export function MensajesScreen() {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user } = useAuth();
  const {
    visibleConversaciones,
    hiddenCount,
    isLoading,
    refreshConversations,
    markInboxAsRead,
    hideConversation,
    restoreHiddenConversations,
  } = useMessaging();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }
      void markInboxAsRead();
      void refreshConversations();
    }, [user, markInboxAsRead, refreshConversations])
  );

  if (!user) {
    return (
      <GuestRequiredView
        title="Mensajería interna"
        description="Iniciá sesión para conversar con organizadores o responder dudas de tus compradores."
      />
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshConversations();
    await markInboxAsRead();
    setRefreshing(false);
  };

  const renderPreview = (conv: Conversacion): string => {
    const last = conv.ultimoMensaje;
    if (!last) {
      return "Sin mensajes";
    }
    if (last.mensaje && last.adjunto) {
      return `${last.mensaje} · Adjunto: ${last.adjunto.nombre}`;
    }
    if (last.adjunto) {
      return `Adjunto: ${last.adjunto.nombre}`;
    }
    return last.mensaje;
  };

  if (isLoading && visibleConversaciones.length === 0) {
    return <LoadingView message="Cargando conversaciones..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visibleConversaciones}
        keyExtractor={(item) => String(item.compraId)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.topBar}>
            <Text style={[styles.syncHint, { color: colors.muted }]}>
              Sincronización automática cada 10s
            </Text>
            {hiddenCount > 0 ? (
              <Pressable onPress={() => void restoreHiddenConversations()}>
                <Text style={[styles.restoreLink, { color: colors.primary }]}>
                  Restaurar ocultos ({hiddenCount})
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.compraId}`)}
            style={({ pressed }) => [
              styles.convCard,
              {
                backgroundColor: colors.surface,
                boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryText }]}>
                {getInitials(item.contraparte.nombre, item.contraparte.apellido)}
              </Text>
            </View>

            <View style={styles.centerCol}>
              <View style={styles.topLine}>
                <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                  {item.contraparte.nombre} {item.contraparte.apellido}
                </Text>
                {item.ultimoMensaje ? (
                  <Text style={[styles.timeText, { color: colors.muted }]}>
                    {formatDateShort(item.ultimoMensaje.enviado)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.rolePill, { backgroundColor: colors.soft }]}>
                  <Text style={[styles.roleText, { color: colors.primary }]}>
                    {item.rolUsuario === "COMPRADOR" ? "Organizador" : "Comprador"}
                  </Text>
                </View>
                <Text style={[styles.eventName, { color: colors.primary }]} numberOfLines={1}>
                  {item.eventoNombre}
                </Text>
              </View>

              <View style={styles.bottomLine}>
                <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={1}>
                  {renderPreview(item)}
                </Text>
                <StatusBadge estado={item.estadoCompra} />
              </View>
            </View>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                void hideConversation(item.compraId, item.ultimoMensaje?.id ?? null);
              }}
              hitSlop={8}
              accessibilityLabel="Ocultar conversación"
              style={styles.hideBtn}
            >
              <AppIcon name="trash" size={17} color={colors.muted} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyView
            icon="chat"
            title="No hay conversaciones activas"
            description="Podés iniciar un chat desde cualquiera de tus compras o desde las compras recibidas en tus eventos."
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
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  syncHint: { fontSize: 11, fontWeight: "600" },
  restoreLink: { fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
  convCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  centerCol: { flex: 1, minWidth: 0, gap: 4 },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.xs,
  },
  personName: { fontSize: 14, fontWeight: "800", flex: 1 },
  timeText: { fontSize: 10, fontVariant: ["tabular-nums"] },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { fontSize: 10, fontWeight: "800" },
  eventName: { fontSize: 12, fontWeight: "700", flex: 1 },
  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  preview: { fontSize: 12, flex: 1 },
  hideBtn: {
    padding: 6,
  },
});
