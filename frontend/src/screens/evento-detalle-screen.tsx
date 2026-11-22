import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import { ErrorView, LoadingView } from "@/components/screen-state";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { compraService } from "@/services/compra-service";
import { eventoService } from "@/services/evento-service";
import { radius, shadows, spacing } from "@/theme";
import type { EventoDetalle } from "@/types/api";
import {
  extractErrorMessage,
  formatCurrencyARS,
  formatDateTime,
  getInitials,
} from "@/utils/format";

export function EventoDetalleScreen({ eventoId }: { eventoId: number }) {
  const router = useRouter();
  const { colors, theme, defaultMyEventsView } = usePreferences();
  const { user, favoritosIds, toggleFavorito } = useAuth();

  const [detalle, setDetalle] = useState<EventoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [successSheetVisible, setSuccessSheetVisible] = useState(false);

  const cargarDetalle = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!detalle) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await eventoService.obtenerDetalle(eventoId);
        setDetalle(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventoId, detalle]
  );

  useFocusEffect(
    useCallback(() => {
      void cargarDetalle(false);
    }, [cargarDetalle])
  );

  const totalSeleccionado = useMemo(() => {
    if (!detalle) {
      return { amount: 0, count: 0 };
    }
    return detalle.tiposEntrada.reduce(
      (acc, tipo) => {
        const qty = quantities[tipo.id] || 0;
        return {
          amount: acc.amount + qty * tipo.precio,
          count: acc.count + qty,
        };
      },
      { amount: 0, count: 0 }
    );
  }, [detalle, quantities]);

  if (loading && !detalle) {
    return <LoadingView message="Cargando detalle del evento..." />;
  }

  if (error || !detalle) {
    return (
      <ErrorView
        message={error || "No encontramos este evento."}
        onRetry={() => void cargarDetalle(false)}
      />
    );
  }

  const isOwner = Boolean(user && user.id === detalle.organizador.id);
  const isFav = favoritosIds.includes(detalle.id);
  const coverUri = detalle.multimedia[0] ?? null;

  const adjustQuantity = (tipoId: number, delta: number, maxCupo: number) => {
    setBuyError(null);
    setQuantities((prev) => {
      const current = prev[tipoId] || 0;
      const next = Math.max(0, Math.min(maxCupo, current + delta));
      return { ...prev, [tipoId]: next };
    });
  };

  const handleComprar = async () => {
    if (!user) {
      router.push("/(tabs)/perfil");
      return;
    }
    const seleccionadas = Object.entries(quantities)
      .map(([id, qty]) => ({ tipoEntradaId: Number(id), cantidad: qty }))
      .filter((item) => item.cantidad > 0);

    if (seleccionadas.length === 0) {
      return;
    }

    setBuying(true);
    setBuyError(null);
    try {
      for (const item of seleccionadas) {
        await compraService.crear({
          eventoId: detalle.id,
          tipoEntradaId: item.tipoEntradaId,
          cantidad: item.cantidad,
        });
      }
      if (process.env.EXPO_OS === "ios") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setQuantities({});
      await cargarDetalle(false);
      setSuccessSheetVisible(true);
    } catch (err) {
      setBuyError(extractErrorMessage(err));
    } finally {
      setBuying(false);
    }
  };

  const reviewsToDisplay =
    detalle.reseniasEvento.length > 0
      ? detalle.reseniasEvento
      : detalle.reseniasEventosAnterioresOrganizador;

  const reviewsSectionTitle =
    detalle.reseniasEvento.length > 0
      ? "Reseñas de este evento"
      : "Experiencias previas con este organizador";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarDetalle(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.heroImg} contentFit="cover" />
          ) : null}
          <View style={styles.heroScrim} />

          <Pressable
            onPress={() => {
              if (!user) {
                router.push("/(tabs)/perfil");
                return;
              }
              void toggleFavorito(detalle.id);
            }}
            style={styles.heroFavBtn}
          >
            <AppIcon
              name={isFav ? "heartFill" : "heart"}
              size={20}
              color={isFav ? colors.accent : "#FFFFFF"}
            />
          </Pressable>

          <View style={styles.heroOverlay}>
            <View style={styles.heroCat}>
              <Text style={styles.heroCatText}>{detalle.categoria.nombre}</Text>
            </View>
            <Text style={styles.heroTitle}>{detalle.nombre}</Text>
            <Text style={styles.heroDate}>{formatDateTime(detalle.fecha)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {isOwner ? (
            <View
              style={[
                styles.ownerBanner,
                {
                  backgroundColor: colors.soft,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                },
              ]}
            >
              <View style={styles.ownerTextCol}>
                <Text style={[styles.ownerTitle, { color: colors.text }]}>
                  Sos el organizador de este evento
                </Text>
                <Text style={[styles.ownerSub, { color: colors.muted }]}>
                  Muchos éxitos con ello. Podés ver tus ventas y confirmar entradas desde el panel.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/gestionar-evento/${detalle.id}`)}
                style={[styles.ownerBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.ownerBtnText, { color: colors.primaryText }]}>
                  Gestionar evento
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.description, { color: colors.muted }]} selectable>
            {detalle.descripcion}
          </Text>

          <Pressable
            onPress={() => router.push(`/organizador/${detalle.organizador.id}`)}
            style={({ pressed }) => [
              styles.orgCard,
              {
                backgroundColor: colors.surface,
                boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.orgLeft}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.primaryText }]}>
                  {getInitials(detalle.organizador.nombre, detalle.organizador.apellido)}
                </Text>
              </View>
              <View style={styles.orgInfo}>
                <Text style={[styles.orgCaption, { color: colors.muted }]}>Organizado por</Text>
                <Text style={[styles.orgName, { color: colors.text }]}>
                  {detalle.organizador.nombre} {detalle.organizador.apellido}
                </Text>
                <Text style={[styles.orgLink, { color: colors.primary }]}>
                  Ver perfil y todos sus eventos
                </Text>
              </View>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.soft }]}>
              <AppIcon name="star" size={14} color={colors.gold} />
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {detalle.cantidadReseniasOrganizador > 0
                  ? detalle.puntajeOrganizador.toFixed(2)
                  : "S/C"}
              </Text>
            </View>
          </Pressable>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tipos de Entrada
            </Text>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: colors.surface,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                },
              ]}
            >
              {detalle.tiposEntrada.map((tipo, index) => {
                const qty = quantities[tipo.id] || 0;
                const sinCupo = tipo.cupo <= 0;
                const disabledStepper = detalle.yaOcurrio || isOwner || sinCupo;

                return (
                  <View
                    key={tipo.id}
                    style={[
                      styles.ticketRow,
                      index > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline },
                      qty > 0 && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <View style={styles.ticketTop}>
                      <View style={styles.ticketInfo}>
                        <Text style={[styles.ticketName, { color: colors.text }]}>
                          {tipo.nombre}
                        </Text>
                        <Text style={[styles.ticketDesc, { color: colors.muted }]}>
                          {tipo.descripcion}
                        </Text>
                      </View>
                      <Text style={[styles.ticketPrice, { color: colors.primary }]}>
                        {formatCurrencyARS(tipo.precio)}
                      </Text>
                    </View>

                    <View style={styles.ticketBottom}>
                      <Text style={[styles.cupoText, { color: colors.muted }]}>
                        {sinCupo ? "Agotado" : `${tipo.cupo} disponibles`}
                      </Text>

                      <View style={styles.stepper}>
                        {qty > 0 ? (
                          <>
                            <Pressable
                              onPress={() => adjustQuantity(tipo.id, -1, tipo.cupo)}
                              accessibilityLabel={
                                qty === 1 ? "Quitar entrada seleccionada" : "Restar cantidad"
                              }
                              style={[
                                styles.stepBtn,
                                {
                                  backgroundColor:
                                    qty === 1 ? colors.dangerBg : colors.surfaceSecondary,
                                },
                              ]}
                            >
                              <AppIcon
                                name={qty === 1 ? "trash" : "minus"}
                                size={16}
                                color={qty === 1 ? colors.dangerFg : colors.text}
                              />
                            </Pressable>
                            <Text style={[styles.qtyText, { color: colors.text }]}>{qty}</Text>
                          </>
                        ) : null}

                        <Pressable
                          disabled={disabledStepper || qty >= tipo.cupo}
                          onPress={() => adjustQuantity(tipo.id, 1, tipo.cupo)}
                          accessibilityLabel="Sumar cantidad"
                          style={[
                            styles.stepBtn,
                            {
                              backgroundColor: colors.primary,
                              opacity: disabledStepper || qty >= tipo.cupo ? 0.35 : 1,
                            },
                          ]}
                        >
                          <AppIcon name="plus" size={16} color={colors.primaryText} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {buyError ? (
            <Text style={[styles.buyError, { color: colors.dangerFg }]} selectable>
              {buyError}
            </Text>
          ) : null}

          {!isOwner ? (
            <Pressable
              disabled={detalle.yaOcurrio || totalSeleccionado.count === 0 || buying}
              onPress={() => void handleComprar()}
              style={({ pressed }) => [
                styles.buyBtn,
                {
                  backgroundColor: detalle.yaOcurrio ? colors.surfaceSecondary : colors.accent,
                  opacity:
                    detalle.yaOcurrio || totalSeleccionado.count === 0 || buying
                      ? 0.5
                      : pressed
                        ? 0.88
                        : 1,
                  boxShadow: detalle.yaOcurrio ? undefined : shadows.raised,
                },
              ]}
            >
              {buying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text
                    style={[
                      styles.buyBtnText,
                      { color: detalle.yaOcurrio ? colors.muted : "#FFFFFF" },
                    ]}
                  >
                    {detalle.yaOcurrio
                      ? "Evento finalizado (compra deshabilitada)"
                      : totalSeleccionado.count > 0
                        ? `Comprar ${totalSeleccionado.count} entrada${totalSeleccionado.count > 1 ? "s" : ""}`
                        : "Seleccioná tus entradas"}
                  </Text>
                  {!detalle.yaOcurrio && totalSeleccionado.count > 0 ? (
                    <Text style={styles.buyBtnAmount}>
                      {formatCurrencyARS(totalSeleccionado.amount)}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {reviewsSectionTitle}
            </Text>
            {reviewsToDisplay.length === 0 ? (
              <View style={[styles.emptyReviewCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyReviewText, { color: colors.muted }]}>
                  Todavía no hay reseñas registradas.
                </Text>
              </View>
            ) : (
              reviewsToDisplay.map((rev) => (
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
        </View>
      </ScrollView>

      <BottomSheet
        visible={successSheetVisible}
        onClose={() => setSuccessSheetVisible(false)}
      >
        <View style={styles.successBox}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.status.CONFIRMADA.bg },
            ]}
          >
            <AppIcon name="check" size={28} color={colors.status.CONFIRMADA.fg} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Reserva registrada como PENDIENTE
          </Text>
          <Text style={[styles.successDesc, { color: colors.muted }]}>
            Descontamos el cupo de tu entrada. Podés seguir su estado o enviar el comprobante al organizador por chat.
          </Text>
          <Pressable
            onPress={() => {
              setSuccessSheetVisible(false);
              router.push(defaultMyEventsView ? "/mis-compras" : "/(tabs)/central");
            }}
            style={[styles.successBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.successBtnText, { color: colors.primaryText }]}>
              Ir a Mis Compras
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  hero: {
    height: 220,
    position: "relative",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  heroImg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 22, 36, 0.52)",
  },
  heroFavBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heroOverlay: { gap: spacing.xs, zIndex: 2 },
  heroCat: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroCatText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  heroDate: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  ownerBanner: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  ownerTextCol: { flex: 1, gap: 4 },
  ownerTitle: { fontSize: 14, fontWeight: "800" },
  ownerSub: { fontSize: 12, lineHeight: 17 },
  ownerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  ownerBtnText: { fontSize: 12, fontWeight: "800" },
  description: { fontSize: 14, lineHeight: 21 },
  orgCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orgLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  orgInfo: { flex: 1, gap: 2 },
  orgCaption: { fontSize: 11 },
  orgName: { fontSize: 15, fontWeight: "800" },
  orgLink: { fontSize: 12, fontWeight: "700" },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  groupedCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  ticketRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  ticketInfo: { flex: 1, gap: 2 },
  ticketName: { fontSize: 15, fontWeight: "800" },
  ticketDesc: { fontSize: 12 },
  ticketPrice: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ticketBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cupoText: { fontSize: 12, fontWeight: "600" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    minWidth: 22,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  buyError: { fontSize: 12, fontWeight: "700" },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  buyBtnText: { fontSize: 14, fontWeight: "800" },
  buyBtnAmount: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  emptyReviewCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  emptyReviewText: { fontSize: 13 },
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
  successBox: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  successDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  successBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  successBtnText: { fontSize: 14, fontWeight: "800" },
});
