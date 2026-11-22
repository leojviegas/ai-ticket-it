import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import { EventCard } from "@/components/event-card";
import { EmptyView, ErrorView, LoadingView } from "@/components/screen-state";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { categoriaService } from "@/services/categoria-service";
import { eventoService } from "@/services/evento-service";
import { radius, shadows, spacing } from "@/theme";
import type { Categoria, Evento } from "@/types/api";
import { extractErrorMessage } from "@/utils/format";

type OrdenCampo = "fecha" | "precio" | "puntaje";

export function InicioScreen() {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user, favoritosIds, toggleFavorito } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState<OrdenCampo>("fecha");
  const [precioMinInput, setPrecioMinInput] = useState("");
  const [precioMaxInput, setPrecioMaxInput] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftOrden, setDraftOrden] = useState<OrdenCampo>("fecha");
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    categoriaService
      .listar(controller.signal)
      .then(setCategorias)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const cargarEventos = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (eventos.length === 0) {
        setLoading(true);
      }
      setError(null);

      try {
        const minNum = precioMinInput.trim() !== "" ? Number(precioMinInput) : undefined;
        const maxNum = precioMaxInput.trim() !== "" ? Number(precioMaxInput) : undefined;
        const data = await eventoService.listar({
          q: searchQuery.trim() || undefined,
          categoriaId: selectedCatId,
          precioMin: Number.isFinite(minNum) ? minNum : undefined,
          precioMax: Number.isFinite(maxNum) ? maxNum : undefined,
          soloFuturos: true,
          ordenarPor,
        });
        setEventos(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedCatId, precioMinInput, precioMaxInput, ordenarPor, eventos.length]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarEventos(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [cargarEventos]);

  useFocusEffect(
    useCallback(() => {
      void cargarEventos(false);
    }, [cargarEventos])
  );

  const openFilters = () => {
    setDraftOrden(ordenarPor);
    setDraftMin(precioMinInput);
    setDraftMax(precioMaxInput);
    setFilterError(null);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    const min = draftMin.trim() !== "" ? Number(draftMin) : undefined;
    const max = draftMax.trim() !== "" ? Number(draftMax) : undefined;
    if (min !== undefined && (Number.isNaN(min) || min < 0)) {
      setFilterError("El precio mínimo debe ser un número válido mayor o igual a 0.");
      return;
    }
    if (max !== undefined && (Number.isNaN(max) || max < 0)) {
      setFilterError("El precio máximo debe ser un número válido mayor o igual a 0.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setFilterError("El precio mínimo no puede superar el precio máximo.");
      return;
    }
    setOrdenarPor(draftOrden);
    setPrecioMinInput(draftMin.trim());
    setPrecioMaxInput(draftMax.trim());
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCatId(undefined);
    setOrdenarPor("fecha");
    setPrecioMinInput("");
    setPrecioMaxInput("");
    setDraftOrden("fecha");
    setDraftMin("");
    setDraftMax("");
    setFilterError(null);
    setFiltersOpen(false);
  };

  const handleToggleFav = async (eventoId: number) => {
    if (!user) {
      router.push("/(tabs)/perfil");
      return;
    }
    try {
      await toggleFavorito(eventoId);
    } catch {
      // Revertido automáticamente por AuthContext
    }
  };

  if (loading && eventos.length === 0) {
    return <LoadingView message="Buscando próximos eventos..." />;
  }

  if (error && eventos.length === 0) {
    return <ErrorView message={error} onRetry={() => void cargarEventos(false)} />;
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCatId !== undefined ||
    precioMinInput !== "" ||
    precioMaxInput !== "" ||
    ordenarPor !== "fecha";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={eventos}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void cargarEventos(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: colors.surface,
                    boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                  },
                ]}
              >
                <AppIcon name="search" size={18} color={colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar eventos, artistas, charlas..."
                  placeholderTextColor={colors.muted}
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <AppIcon name="close" size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={openFilters}
                accessibilityLabel="Ordenar y filtrar"
                style={({ pressed }) => [
                  styles.filterBtn,
                  {
                    backgroundColor: colors.primary,
                    boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <AppIcon name="sliders" size={18} color={colors.primaryText} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <Pressable
                onPress={() => setSelectedCatId(undefined)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedCatId === undefined ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedCatId === undefined ? colors.primaryText : colors.text,
                    },
                  ]}
                >
                  Todas
                </Text>
              </Pressable>

              {categorias.map((cat) => {
                const active = selectedCatId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCatId(active ? undefined : cat.id)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.primary : colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.primaryText : colors.text },
                      ]}
                    >
                      {cat.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Próximos eventos
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.muted }]}>
                {eventos.length} disponibles · por {ordenarPor}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            evento={item}
            isFavorite={favoritosIds.includes(item.id)}
            onPress={() => router.push(`/evento/${item.id}`)}
            onToggleFavorite={() => void handleToggleFav(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyView
            icon="search"
            title="Sin resultados"
            description="No encontramos eventos próximos con los filtros seleccionados."
            actionLabel={hasActiveFilters ? "Limpiar filtros" : undefined}
            onAction={hasActiveFilters ? clearAllFilters : undefined}
          />
        }
      />

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Ordenar y filtrar</Text>
          <Pressable onPress={clearAllFilters}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Restablecer</Text>
          </Pressable>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.label, { color: colors.text }]}>Ordenar por</Text>
          <View style={styles.orderRow}>
            {(
              [
                ["fecha", "Fecha"],
                ["precio", "Precio"],
                ["puntaje", "Puntaje"],
              ] as const
            ).map(([key, title]) => {
              const active = draftOrden === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setDraftOrden(key)}
                  style={[
                    styles.orderBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.orderBtnText,
                      { color: active ? colors.primaryText : colors.text },
                    ]}
                  >
                    {title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.label, { color: colors.text }]}>Rango de precio (ARS)</Text>
          <View style={styles.priceInputsRow}>
            <View style={[styles.priceInputBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.inputHint, { color: colors.muted }]}>Mínimo</Text>
              <TextInput
                value={draftMin}
                onChangeText={setDraftMin}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.muted}
                style={[styles.priceInput, { color: colors.text }]}
              />
            </View>
            <View style={[styles.priceInputBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.inputHint, { color: colors.muted }]}>Máximo</Text>
              <TextInput
                value={draftMax}
                onChangeText={setDraftMax}
                keyboardType="numeric"
                placeholder="Sin límite"
                placeholderTextColor={colors.muted}
                style={[styles.priceInput, { color: colors.text }]}
              />
            </View>
          </View>
        </View>

        {filterError ? (
          <Text style={[styles.errorText, { color: colors.dangerFg }]}>{filterError}</Text>
        ) : null}

        <Pressable
          onPress={applyFilters}
          style={({ pressed }) => [
            styles.applyBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={[styles.applyBtnText, { color: colors.primaryText }]}>
            Aplicar filtros
          </Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: { gap: spacing.md },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  resetText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sheetSection: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  orderBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderCurve: "continuous",
    alignItems: "center",
  },
  orderBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  priceInputsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priceInputBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderCurve: "continuous",
    gap: 4,
  },
  inputHint: {
    fontSize: 11,
    fontWeight: "600",
  },
  priceInput: {
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  applyBtn: {
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
