import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import {
  EmptyView,
  ErrorView,
  GuestRequiredView,
  LoadingView,
} from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { ApiError } from "@/services/api";
import { compraService } from "@/services/compra-service";
import { reseniaService } from "@/services/resenia-service";
import { radius, shadows, spacing } from "@/theme";
import { EstadoCompra, type Compra, type EstadoCompraType } from "@/types/api";
import {
  extractErrorMessage,
  formatCurrencyARS,
  formatDateShort,
  formatDateTime,
  getCambioEstadoActorLabel,
  getConfirmedCountdownLabel,
} from "@/utils/format";

type ScopeFilter = "todos" | "futuros";
type HistorySortOrder = "asc" | "desc";
type EstadoFilter = "TODOS" | EstadoCompraType;

const ESTADOS_FILTRO: EstadoFilter[] = [
  "TODOS",
  EstadoCompra.PENDIENTE,
  EstadoCompra.CONFIRMADA,
  EstadoCompra.UTILIZADA,
  EstadoCompra.CANCELADA,
  EstadoCompra.REEMBOLSADA,
];

export function MisComprasScreen() {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user } = useAuth();

  const [scope, setScope] = useState<ScopeFilter>("futuros");
  const [historyOrder, setHistoryOrder] = useState<HistorySortOrder>("desc");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFilter>("TODOS");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingCompra, setTrackingCompra] = useState<Compra | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Compra | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [rateTarget, setRateTarget] = useState<Compra | null>(null);
  const [puntuacion, setPuntuacion] = useState(5);
  const [detalleResenia, setDetalleResenia] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [userId]);

  const cargarCompras = useCallback(
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
        const data = await compraService.listar({
          soloFuturos: scope === "futuros" ? true : undefined,
          estado: estadoFiltro === "TODOS" ? undefined : estadoFiltro,
        });
        hasLoadedRef.current = true;
        setCompras(data);
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
    [userId, scope, estadoFiltro]
  );

  useFocusEffect(
    useCallback(() => {
      void cargarCompras(false);
    }, [cargarCompras])
  );

  const sortedCompras = useMemo(() => {
    const copy = [...compras];
    copy.sort((a, b) => {
      const timeA = new Date(a.evento.fecha).getTime();
      const timeB = new Date(b.evento.fecha).getTime();
      if (scope === "futuros") {
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.id - b.id;
      }
      if (timeA !== timeB) {
        return historyOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return historyOrder === "asc" ? a.id - b.id : b.id - a.id;
    });
    return copy;
  }, [compras, scope, historyOrder]);

  if (!user) {
    return (
      <GuestRequiredView
        title="Consultá tus entradas"
        description="Iniciá sesión para ver el estado de tus compras, seguir envíos, chatear y calificar eventos."
      />
    );
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) {
      return;
    }
    setCanceling(true);
    setActionError(null);
    try {
      await compraService.cancelar(cancelTarget.id);
      setCancelTarget(null);
      await cargarCompras(false);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setCanceling(false);
    }
  };

  const handleSendReview = async () => {
    if (!rateTarget) {
      return;
    }
    if (detalleResenia.trim() === "") {
      setReviewError("Por favor escribí un comentario sobre tu experiencia.");
      return;
    }
    setSavingReview(true);
    setReviewError(null);
    try {
      await reseniaService.crear({
        eventoId: rateTarget.evento.id,
        puntuacion,
        detalle: detalleResenia.trim(),
      });
      setRateTarget(null);
      setDetalleResenia("");
      setPuntuacion(5);
      await cargarCompras(false);
    } catch (err) {
      setReviewError(extractErrorMessage(err));
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedCompras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarCompras(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.filtersBlock}>
            <View
              style={[
                styles.segmented,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              {(
                [
                  ["futuros", "Compras de eventos futuros"],
                  ["todos", "Historial de compras"],
                ] as const
              ).map(([key, label]) => {
                const active = scope === key;
                return (
                  <Pressable
                    key={key}
                    testID={`scope-${key}`}
                    onPress={() => setScope(key)}
                    style={[
                      styles.segmentBtn,
                      active && {
                        backgroundColor: colors.surface,
                        boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? colors.primary : colors.muted },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {scope === "todos" ? (
              <View testID="history-sort-row" style={styles.historySortRow}>
                <Text style={[styles.historySortLabel, { color: colors.muted }]}>
                  Orden por fecha del evento
                </Text>
                <View style={styles.historySortPills}>
                  {(
                    [
                      ["asc", "Más antiguo → futuro"],
                      ["desc", "Más futuro → antiguo"],
                    ] as const
                  ).map(([ord, lbl]) => {
                    const active = historyOrder === ord;
                    return (
                      <Pressable
                        key={ord}
                        testID={`history-sort-${ord}`}
                        onPress={() => setHistoryOrder(ord)}
                        style={[
                          styles.sortPill,
                          {
                            backgroundColor: active ? colors.primarySoft : colors.surface,
                            borderColor: active ? colors.primary : colors.hairline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortPillText,
                            { color: active ? colors.primary : colors.muted },
                          ]}
                        >
                          {lbl}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {ESTADOS_FILTRO.map((st) => {
                const active = estadoFiltro === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setEstadoFiltro(st)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.primaryText : colors.text },
                      ]}
                    >
                      {st === "TODOS" ? "Todos" : st}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const canCancel =
            (item.estado === EstadoCompra.PENDIENTE ||
              item.estado === EstadoCompra.CONFIRMADA) &&
            !item.evento.yaOcurrio;
          const canRate =
            item.estado === EstadoCompra.UTILIZADA && !item.yaReseniado;

          return (
            <View
              style={[
                styles.ticketCard,
                {
                  backgroundColor: colors.surface,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                },
              ]}
            >
              <View style={styles.ticketMain}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketInfo}>
                    <Text style={[styles.dateText, { color: colors.muted }]}>
                      {formatDateShort(item.evento.fecha)}
                    </Text>
                    <Pressable onPress={() => router.push(`/evento/${item.evento.id}`)}>
                      <Text style={[styles.eventTitle, { color: colors.text }]}>
                        {item.evento.nombre}
                      </Text>
                    </Pressable>
                    <Text style={[styles.detailText, { color: colors.muted }]}>
                      {item.cantidad}x {item.tipoEntrada.nombre} ·{" "}
                      <Text style={{ color: colors.text, fontWeight: "800" }}>
                        {formatCurrencyARS(item.total)}
                      </Text>
                    </Text>
                  </View>
                  <StatusBadge estado={item.estado} />
                </View>

                {item.estado === EstadoCompra.CONFIRMADA ? (
                  <View style={[styles.countdownBox, { backgroundColor: colors.soft }]}>
                    <Text style={[styles.countdownText, { color: colors.text }]}>
                      {getConfirmedCountdownLabel(
                        item.evento.fecha,
                        item.diasParaEvento
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={[
                  styles.ticketStub,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderTopColor: colors.hairline,
                  },
                ]}
              >
                <Pressable
                  testID={`compra-tracking-${item.id}`}
                  onPress={() => setTrackingCompra(item)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                >
                  <AppIcon name="timeline" size={14} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    Seguimiento de la compra
                  </Text>
                </Pressable>

                <Pressable
                  testID={`compra-chat-${item.id}`}
                  onPress={() => router.push(`/chat/${item.id}`)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <AppIcon name="chat" size={14} color={colors.primaryText} />
                  <Text style={[styles.actionText, { color: colors.primaryText }]}>
                    Chat
                  </Text>
                </Pressable>

                {canCancel ? (
                  <Pressable
                    testID={`compra-cancel-${item.id}`}
                    onPress={() => {
                      setActionError(null);
                      setCancelTarget(item);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.dangerBg }]}
                  >
                    <Text style={[styles.actionText, { color: colors.dangerFg }]}>
                      Cancelar
                    </Text>
                  </Pressable>
                ) : null}

                {canRate ? (
                  <Pressable
                    onPress={() => {
                      setPuntuacion(5);
                      setDetalleResenia("");
                      setReviewError(null);
                      setRateTarget(item);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.gold }]}
                  >
                    <AppIcon name="star" size={14} color="#0D3B66" />
                    <Text style={[styles.actionText, { color: "#0D3B66" }]}>
                      Calificar evento
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingView message="Cargando tus compras..." />
          ) : error ? (
            <ErrorView message={error} onRetry={() => void cargarCompras(false)} />
          ) : (
            <EmptyView
              icon="ticket"
              title="No hay compras para mostrar"
              description="Cuando reserves entradas para un evento aparecerán aquí con su estado actualizado."
              actionLabel="Explorar eventos"
              onAction={() => router.push("/(tabs)")}
            />
          )
        }
      />

      {/* Bottom sheet Seguimiento de la compra */}
      <BottomSheet
        visible={trackingCompra !== null}
        onClose={() => setTrackingCompra(null)}
      >
        {trackingCompra ? (
          <>
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Seguimiento de la compra
              </Text>
              <Text style={[styles.sheetSub, { color: colors.muted }]}>
                {trackingCompra.evento.nombre} · {trackingCompra.cantidad}x{" "}
                {trackingCompra.tipoEntrada.nombre}
              </Text>
            </View>

            <View style={styles.timeline}>
              {trackingCompra.cambiosEstado.map((cambio, idx) => (
                <View key={cambio.id} style={styles.timelineItem}>
                  <View style={styles.timelineTrack}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <AppIcon name="check" size={10} color={colors.primaryText} />
                    </View>
                    {idx < trackingCompra.cambiosEstado.length - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: colors.hairline },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.timelineCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <View style={styles.timelineLeft}>
                      <StatusBadge estado={cambio.estado} />
                      <Text style={[styles.timelineDate, { color: colors.muted }]}>
                        {formatDateTime(cambio.fechaHora)}
                      </Text>
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={[styles.actorHint, { color: colors.muted }]}>
                        ¿Quién inició el cambio?
                      </Text>
                      <Text style={[styles.actorRole, { color: colors.text }]}>
                        {getCambioEstadoActorLabel(trackingCompra, cambio.quien.id)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </BottomSheet>

      {/* Bottom sheet Cancelar */}
      <BottomSheet
        visible={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
      >
        {cancelTarget ? (
          <View style={styles.sheetBody}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Cancelar compra
            </Text>
            <Text style={[styles.sheetDesc, { color: colors.muted }]}>
              Se devolverá el cupo de {cancelTarget.cantidad}x{" "}
              {cancelTarget.tipoEntrada.nombre} en {cancelTarget.evento.nombre} y pasará a
              estado CANCELADA para que el organizador gestione el reembolso.
            </Text>
            {actionError ? (
              <Text style={[styles.errorText, { color: colors.dangerFg }]}>
                {actionError}
              </Text>
            ) : null}
            <View style={styles.sheetButtons}>
              <Pressable
                onPress={() => setCancelTarget(null)}
                style={[styles.secondaryBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Volver
                </Text>
              </Pressable>
              <Pressable
                testID="confirm-cancel-btn"
                disabled={canceling}
                onPress={() => void handleConfirmCancel()}
                style={[styles.primaryBtn, { backgroundColor: colors.dangerFg }]}
              >
                {canceling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnWhite}>Confirmar cancelación</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </BottomSheet>

      {/* Bottom sheet Calificar */}
      <BottomSheet
        visible={rateTarget !== null}
        onClose={() => setRateTarget(null)}
      >
        {rateTarget ? (
          <View style={styles.sheetBody}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Calificar experiencia
            </Text>
            <Text style={[styles.sheetSub, { color: colors.muted }]}>
              {rateTarget.evento.nombre}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setPuntuacion(star)}
                  hitSlop={6}
                >
                  <AppIcon
                    name={star <= puntuacion ? "star" : "starOutline"}
                    size={34}
                    color={star <= puntuacion ? colors.gold : colors.muted}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={detalleResenia}
              onChangeText={setDetalleResenia}
              multiline
              numberOfLines={3}
              placeholder="Contá qué te pareció el evento y la organización..."
              placeholderTextColor={colors.muted}
              style={[
                styles.reviewInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
            />

            {reviewError ? (
              <Text style={[styles.errorText, { color: colors.dangerFg }]}>
                {reviewError}
              </Text>
            ) : null}

            <Pressable
              disabled={savingReview}
              onPress={() => void handleSendReview()}
              style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}
            >
              {savingReview ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={[styles.submitReviewText, { color: colors.primaryText }]}>
                  Enviar reseña
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </BottomSheet>
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
  filtersBlock: { gap: spacing.sm },
  segmented: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  historySortRow: { gap: 6 },
  historySortLabel: { fontSize: 11, fontWeight: "700" },
  historySortPills: { flexDirection: "row", gap: spacing.sm },
  sortPill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sortPillText: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  chipText: { fontSize: 11, fontWeight: "800" },
  ticketCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  ticketMain: { padding: spacing.md, gap: spacing.sm },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  ticketInfo: { flex: 1, gap: 3 },
  dateText: { fontSize: 11, fontWeight: "600" },
  eventTitle: { fontSize: 16, fontWeight: "800" },
  detailText: { fontSize: 13, fontVariant: ["tabular-nums"] },
  countdownBox: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  countdownText: { fontSize: 13, fontWeight: "800" },
  ticketStub: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  sheetHead: { gap: 2 },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  sheetSub: { fontSize: 13 },
  timeline: { gap: spacing.sm },
  timelineItem: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timelineTrack: {
    alignItems: "center",
    width: 20,
    paddingTop: 10,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  timelineLeft: { gap: 6, alignItems: "flex-start" },
  timelineDate: { fontSize: 11, fontVariant: ["tabular-nums"] },
  timelineRight: { alignItems: "flex-end", gap: 2 },
  actorHint: { fontSize: 10 },
  actorRole: { fontSize: 13, fontWeight: "800" },
  sheetBody: { gap: spacing.md },
  sheetDesc: { fontSize: 13, lineHeight: 19 },
  sheetButtons: { flexDirection: "row", gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryBtnWhite: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reviewInput: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: 12,
    minHeight: 88,
    textAlignVertical: "top",
    fontSize: 14,
  },
  errorText: { fontSize: 12, fontWeight: "700" },
  submitReviewBtn: {
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  submitReviewText: { fontSize: 14, fontWeight: "800" },
});
