import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { usePreferences } from "@/context/preferences-context";
import { radius, spacing } from "@/theme";

export function HeaderSwapButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, showMyEventsBtn, defaultMyEventsView } = usePreferences();

  if (!defaultMyEventsView && !showMyEventsBtn) {
    return null;
  }

  const targetIsCompras = defaultMyEventsView;
  const isActive = targetIsCompras
    ? pathname.includes("mis-compras")
    : pathname.includes("mis-eventos");

  return (
    <Pressable
      onPress={() => router.push(targetIsCompras ? "/mis-compras" : "/mis-eventos")}
      accessibilityLabel={targetIsCompras ? "Mis Compras" : "Mis Eventos"}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isActive ? colors.primary : colors.soft,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppIcon
        name={targetIsCompras ? "ticket" : "calendar"}
        size={20}
        color={isActive ? colors.primaryText : colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
});
