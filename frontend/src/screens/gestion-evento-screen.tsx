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
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { EmptyView, ErrorView, LoadingView } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { ApiError } from "@/services/api";
import { compraService } from "@/services/compra-service";
import { eventoService } from "@/services/evento-service";
import { radius, shadows, spacing } from "@/theme";
import {
  EstadoCompra,
  type Compra,
  type EstadoCompraType,
  type PanelEventoResponse,
} from "@/types/api";
import { extractErrorMessage, formatCurrencyARS, formatDateShort } from "@/utils/format";

type EstadoFilter = "TODOS" | EstadoCompraType;

const ESTADOS_FILTRO: EstadoFilter[] = [
  "TODOS",
  EstadoCompra.PENDIENTE,
  EstadoCompra.CONFIRMADA,
  EstadoCompra.UTILIZADA,
  EstadoCompra.CANCELADA,
  EstadoCompra.REEMBOLSADA,
];

export function GestionEventoScreen({ eventoId }: { eventoId: number }) {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user, isHydrated, redirectToLogin } = useAuth();

  const [panel, setPanel] = useState<PanelEventoResponse | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFilter>("TODOS");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [eventoId]);

  useEffect(() => {
    if (isHydrated && !user) {
      redirectToLogin();
    }
  }, [isHydrated, user, redirectToLogin]);

  const cargarPanel = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await eventoService.obtenerComprasYDisponibilidad(
          eventoId,
          estadoFiltro === "TODOS" ? undefined : estadoFiltro
        );
        hasLoadedRef.current = true;
        setPanel(data);
        setSelectedIds((prev) =>
          prev.filter((id) => data.compras.some((c) => c.id === id))
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          redirectToLogin();
          return;
        }
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventoId, estadoFiltro, redirectToLogin]
  );

  useFocusEffect(
    useCallback(() => {
      void cargarPanel(false);
    }, [cargarPanel])
  );

  const selectedCompras = useMemo(() => {
    if (!panel) {
      return [];
    }
    return panel.compras.filter((c) => selectedIds.includes(c.id));
  }, [panel, selectedIds]);

  const toggleSelect = (id: number) => {
    setActionFeedback(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runBatchAction = async (
    actionType: "CONFIRMAR" | "REEMBOLSAR" | "CANCELAR"
  ) => {
    if (selectedCompras.length === 0) {
      return;
    }

    const targets: Compra[] = selectedCompras.filter((c) => {
      if (actionType === "CONFIRMAR") {
        return c.estado === EstadoCompra.PENDIENTE;
      }
      if (actionType === "CANCELAR") {
        return (
          !panel?.evento.yaOcurrio &&
          (c.estado === EstadoCompra.PENDIENTE || c.estado === EstadoCompra.CONFIRMADA)
        );
      }
      if (actionType === "REEMBOLSAR") {
        return c.estado === EstadoCompra.CANCELADA;
      }
      return false;
    });

    if (targets.length === 0) {
      return;
    }

    setProcessing(true);
    setActionFeedback(null);
    let fallos = 0;

    for (const c of targets) {
      try {
        if (actionType === "CONFIRMAR") {
          await compraService.actualizarEstado(c.id, EstadoCompra.CONFIRMADA);
        } else if (actionType === "REEMBOLSAR") {
          await compraService.reembolsar(c.id);
        } else if (actionType === "CANCELAR") {
          await compraService.cancelar(c.id);
        }
      } catch {
        fallos += 1;
      }
    }

    setSelectedIds([]);
    await cargarPanel(false);
    if (fallos > 0) {
      setActionFeedback(
        `${targets.length - fallos} actualizadas; ${fallos} no pudieron procesarse según las reglas del estado.`
      );
    }
    setProcessing(false);
  };

  if (loading && !panel) {
    return <LoadingView message="Cargando panel del evento..." />;
  }

  if (error || !panel) {
    return (
      <ErrorView
        message={error || "No pudimos cargar el panel de gestión."}
        onRetry={() => void cargarPanel(false)}
      />
    );
  }

  const hasPendientes = selectedCompras.some((c) => c.estado === EstadoCompra.PENDIENTE);
  const hasCancelables =
    !panel.evento.yaOcurrio &&
    selectedCompras.some(
      (c) => c.estado === EstadoCompra.PENDIENTE || c.estado === EstadoCompra.CONFIRMADA
    );
  const hasCanceladas = selectedCompras.some((c) => c.estado === EstadoCompra.CANCELADA);
  const hasActions = hasPendientes || hasCancelables || hasCanceladas;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={panel.compras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          selectedCompras.length > 0 && { paddingBottom: 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarPanel(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.titleBlock}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {panel.evento.nombre}
              </Text>
              <Text style={[styles.eventDate, { color: colors.muted }]}>
                {formatDateShort(panel.evento.fecha)}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Disponibilidad por tipo de entrada
            </Text>

            <View style={styles.dispGrid}>
              {panel.disponibilidadPorTipo.map((tipo) => (
                <View
                  key={tipo.id}
                  style={[
                    styles.dispCard,
                    {
                      backgroundColor: colors.surface,
                      boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                    },
                  ]}
                >
                  <Text style={[styles.dispName, { color: colors.text }]} numberOfLines={1}>
                    {tipo.nombre}
                  </Text>
                  <Text style={[styles.dispCupo, { color: colors.primary }]}>
                    {tipo.cupoDisponible}{" "}
                    <Text style={[styles.dispCupoLabel, { color: colors.muted }]}>
                      disp.
                    </Text>
                  </Text>
                  <Text style={[styles.dispMeta, { color: colors.muted }]}>
                    Vendidas: {tipo.entradasVendidas} · Res: {tipo.entradasReservadas}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.comprasHead}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Compras asociadas ({panel.compras.length})
              </Text>
              {panel.compras.length > 0 ? (
                <Pressable
                  onPress={() =>
                    setSelectedIds(
                      selectedIds.length === panel.compras.length
                        ? []
                        : panel.compras.map((c) => c.id)
                    )
                  }
                >
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {selectedIds.length === panel.compras.length
                      ? "Deseleccionar"
                      : "Seleccionar todas"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

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
                      {st === "TODOS" ? "Todas" : st}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {actionFeedback ? (
              <Text style={[styles.feedbackText, { color: colors.dangerFg }]}>
                {actionFeedback}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const checked = selectedIds.includes(item.id);
          return (
            <Pressable
              key={item.id}
              testID={`gestion-compra-${item.id}`}
              onPress={() => toggleSelect(item.id)}
              style={[
                styles.compraRow,
                {
                  backgroundColor: checked ? colors.primarySoft : colors.surface,
                  boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                  borderColor: checked ? colors.primary : "transparent",
                  borderWidth: 1.5,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: checked ? colors.primary : colors.surfaceSecondary,
                  },
                ]}
              >
                {checked ? (
                  <AppIcon name="check" size={14} color={colors.primaryText} />
                ) : null}
              </View>

              <View style={styles.compraInfo}>
                <Text style={[styles.buyerName, { color: colors.text }]}>
                  {item.comprador.nombre} {item.comprador.apellido}
                </Text>
                <Text style={[styles.compraDetail, { color: colors.muted }]}>
                  {item.cantidad}x {item.tipoEntrada.nombre} ·{" "}
                  {formatCurrencyARS(item.total)}
                </Text>
              </View>

              <View style={styles.compraRight}>
                <StatusBadge estado={item.estado} />
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/chat/${item.id}`);
                  }}
                  style={[styles.chatChip, { backgroundColor: colors.soft }]}
                >
                  <AppIcon name="chat" size={14} color={colors.primary} />
                  <Text style={[styles.chatChipText, { color: colors.primary }]}>
                    Chat
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyView
            icon="ticket"
            title="Sin compras en este estado"
            description="No hay compras que coincidan con el filtro elegido."
          />
        }
      />

      {selectedCompras.length > 0 ? (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.surface,
              boxShadow: shadows.raised,
            },
          ]}
        >
          <Text style={[styles.selectedLabel, { color: colors.primary }]}>
            {selectedCompras.length} selec.
          </Text>

          {processing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.batchActions}
            >
              {hasPendientes ? (
                <Pressable
                  testID="batch-confirm-btn"
                  onPress={() => void runBatchAction("CONFIRMAR")}
                  style={[
                    styles.batchBtn,
                    { backgroundColor: colors.status.CONFIRMADA.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.batchBtnText,
                      { color: colors.status.CONFIRMADA.fg },
                    ]}
                  >
                    Confirmar
                  </Text>
                </Pressable>
              ) : null}

              {hasCanceladas ? (
                <Pressable
                  testID="batch-refund-btn"
                  onPress={() => void runBatchAction("REEMBOLSAR")}
                  style={[
                    styles.batchBtn,
                    { backgroundColor: colors.status.REEMBOLSADA.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.batchBtnText,
                      { color: colors.status.REEMBOLSADA.fg },
                    ]}
                  >
                    Reembolsar
                  </Text>
                </Pressable>
              ) : null}

              {hasCancelables ? (
                <Pressable
                  testID="batch-cancel-btn"
                  onPress={() => void runBatchAction("CANCELAR")}
                  style={[
                    styles.batchBtn,
                    { backgroundColor: colors.status.CANCELADA.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.batchBtnText,
                      { color: colors.status.CANCELADA.fg },
                    ]}
                  >
                    Cancelar
                  </Text>
                </Pressable>
              ) : null}

              {!hasActions ? (
                <Text style={[styles.noActionsText, { color: colors.muted }]}>
                  Sin acciones disponibles
                </Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.xs },
  titleBlock: { gap: 2 },
  eventTitle: { fontSize: 20, fontWeight: "800" },
  eventDate: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginTop: spacing.xs },
  dispGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dispCard: {
    flexGrow: 1,
    minWidth: "46%",
    padding: 12,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    gap: 4,
  },
  dispName: { fontSize: 13, fontWeight: "800" },
  dispCupo: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  dispCupoLabel: { fontSize: 11, fontWeight: "600" },
  dispMeta: { fontSize: 11 },
  comprasHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  selectAllText: { fontSize: 12, fontWeight: "800" },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  chipText: { fontSize: 11, fontWeight: "800" },
  feedbackText: { fontSize: 12, fontWeight: "700" },
  compraRow: {
    padding: 14,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  compraInfo: { flex: 1, gap: 2 },
  buyerName: { fontSize: 14, fontWeight: "800" },
  compraDetail: { fontSize: 12, fontVariant: ["tabular-nums"] },
  compraRight: { alignItems: "flex-end", gap: 6 },
  chatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chatChipText: { fontSize: 11, fontWeight: "800" },
  actionBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectedLabel: { fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  batchActions: { gap: spacing.xs },
  batchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  batchBtnText: { fontSize: 12, fontWeight: "800" },
  noActionsText: { fontSize: 12, fontWeight: "600", paddingHorizontal: 4 },
});
