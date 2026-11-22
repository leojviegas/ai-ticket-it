import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { usePreferences } from "@/context/preferences-context";
import { SESSION_EXPIRED_MESSAGE } from "@/services/api";
import { radius, shadows, spacing } from "@/theme";

export function LoadingView({ message = "Cargando..." }: { message?: string }) {
  const { colors } = usePreferences();
  return (
    <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.desc, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
  isAuthError,
}: {
  message: string;
  onRetry?: () => void;
  isAuthError?: boolean;
}) {
  const router = useRouter();
  const { colors } = usePreferences();
  const expired = Boolean(
    isAuthError || message === SESSION_EXPIRED_MESSAGE || /token/i.test(message)
  );
  const displayMessage = expired ? SESSION_EXPIRED_MESSAGE : message;
  const handlePress = expired
    ? () => {
        if (router.canDismiss()) {
          router.dismissAll();
        }
        router.navigate("/(tabs)/perfil");
      }
    : onRetry;

  return (
    <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerBg }]}>
        <AppIcon name="close" size={28} color={colors.dangerFg} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {expired ? "Tu sesión venció" : "No pudimos cargar los datos"}
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]} selectable>
        {displayMessage}
      </Text>
      {handlePress ? (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: colors.primaryText }]}>
            {expired ? "Ir a Iniciar Sesión" : "Reintentar"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyView({
  icon = "ticket",
  title,
  description,
  actionLabel,
  onAction,
  actionTestID,
  secondaryNote,
}: {
  icon?: AppIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestID?: string;
  secondaryNote?: string;
}) {
  const { colors, theme } = usePreferences();
  return (
    <View style={styles.emptyBox}>
      <View style={[styles.iconCircleLarge, { backgroundColor: colors.soft }]}>
        <AppIcon name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: colors.muted }]}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          testID={actionTestID}
          onPress={onAction}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.primary,
              boxShadow: theme === "dark" ? shadows.darkCard : shadows.raised,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.btnText, { color: colors.primaryText }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {secondaryNote ? (
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.noteText, { color: colors.muted }]}>{secondaryNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function GuestRequiredView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  return (
    <EmptyView
      icon="user"
      title={title}
      description={description}
      actionLabel="Ir a Iniciar Sesión"
      onAction={() => router.push("/(tabs)/perfil")}
    />
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleLarge: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
  },
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    minWidth: 200,
    alignItems: "center",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  noteCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    maxWidth: 310,
  },
  noteText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
