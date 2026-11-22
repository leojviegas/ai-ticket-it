import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { usePreferences } from "@/context/preferences-context";
import { radius, spacing } from "@/theme";
import type { EstadoCompraType } from "@/types/api";

const ESTADO_ICON: Record<EstadoCompraType, AppIconName> = {
  PENDIENTE: "clock",
  CONFIRMADA: "check",
  UTILIZADA: "ticket",
  CANCELADA: "close",
  REEMBOLSADA: "refund",
};

export function StatusBadge({ estado }: { estado: EstadoCompraType }) {
  const { colors } = usePreferences();
  const token = colors.status[estado];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: token.bg,
          borderColor: token.border,
          borderWidth: colors.borderWidth,
        },
      ]}
    >
      <AppIcon name={ESTADO_ICON[estado]} size={12} color={token.fg} />
      <Text style={[styles.label, { color: token.fg }]}>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
