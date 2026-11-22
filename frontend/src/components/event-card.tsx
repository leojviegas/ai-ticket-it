import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { usePreferences } from "@/context/preferences-context";
import { radius, shadows, spacing } from "@/theme";
import type { Evento } from "@/types/api";
import {
  formatCalendarBadge,
  formatCurrencyARS,
  formatDateShort,
  getInitials,
} from "@/utils/format";

interface EventCardProps {
  evento: Evento;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function EventCard({
  evento,
  isFavorite,
  onPress,
  onToggleFavorite,
}: EventCardProps) {
  const { colors, theme } = usePreferences();
  const [imageFailed, setImageFailed] = useState(false);
  const coverUri = !imageFailed && evento.multimedia[0] ? evento.multimedia[0] : null;
  const cal = formatCalendarBadge(evento.fecha);

  const handleFavoritePress = () => {
    if (process.env.EXPO_OS === "ios") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleFavorite();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={[styles.coverContainer, { backgroundColor: colors.primary }]}>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.coverFallback}>
            <AppIcon name="ticket" size={40} color="rgba(255,255,255,0.35)" />
          </View>
        )}
        <View style={styles.coverScrim} />

        <View style={styles.topRow}>
          <View style={styles.calBadge}>
            <Text style={styles.calTop}>{cal.top}</Text>
            <Text style={styles.calBottom}>{cal.bottom}</Text>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleFavoritePress();
            }}
            hitSlop={10}
            accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            style={({ pressed }) => [
              styles.favBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppIcon
              name={isFavorite ? "heartFill" : "heart"}
              size={18}
              color={isFavorite ? colors.accent : "#FFFFFF"}
            />
          </Pressable>
        </View>

        <View style={styles.bottomOverlay}>
          <View style={styles.catChip}>
            <Text style={styles.catChipText}>{evento.categoria.nombre}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {evento.nombre}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.organizerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.soft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {getInitials(evento.organizador.nombre, evento.organizador.apellido)}
            </Text>
          </View>
          <View style={styles.orgInfo}>
            <Text style={[styles.orgName, { color: colors.text }]} numberOfLines={1}>
              {evento.organizador.nombre} {evento.organizador.apellido}
            </Text>
            <View style={styles.metaRow}>
              <AppIcon name="star" size={12} color={colors.gold} />
              <Text style={[styles.scoreText, { color: colors.text }]}>
                {evento.cantidadReseniasOrganizador > 0
                  ? evento.puntajeOrganizador.toFixed(1)
                  : "Nuevo"}
              </Text>
              <Text style={[styles.dateText, { color: colors.muted }]} numberOfLines={1}>
                · {formatDateShort(evento.fecha)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.pricePill, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.priceFrom, { color: colors.muted }]}>Desde</Text>
          <Text style={[styles.priceValue, { color: colors.accent }]}>
            {formatCurrencyARS(evento.precioMinimo)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  coverContainer: {
    height: 168,
    position: "relative",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverFallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  coverScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 22, 36, 0.42)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 2,
  },
  calBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 48,
  },
  calTop: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0D3B66",
    fontVariant: ["tabular-nums"],
  },
  calBottom: {
    fontSize: 9,
    fontWeight: "700",
    color: "#52606D",
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOverlay: {
    gap: spacing.xs,
    zIndex: 2,
  },
  catChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  catChipText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "800",
  },
  orgInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  orgName: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dateText: {
    fontSize: 11,
    flexShrink: 1,
  },
  pricePill: {
    borderRadius: radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  priceFrom: {
    fontSize: 9,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
