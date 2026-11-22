import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { radius, shadows, spacing } from "@/theme";
import { extractErrorMessage, getInitials } from "@/utils/format";

export function PerfilScreen() {
  const router = useRouter();
  const { colors, theme, defaultMyEventsView } = usePreferences();
  const { user, sessionExpiredMessage, login, register, logout, verifySession } =
    useAuth();

  const userId = user?.id ?? null;

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        void verifySession().catch(() => {});
      }
    }, [userId, verifySession])
  );

  const [mode, setMode] = useState<"login" | "register">("login");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Completá tu correo electrónico y contraseña.");
      return;
    }
    if (mode === "register" && (!nombre.trim() || !apellido.trim())) {
      setError("Completá tu nombre y apellido para crear la cuenta.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          password,
        });
      }
      setPassword("");
      router.navigate(defaultMyEventsView ? "/(tabs)/central" : "/(tabs)");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
            <AppIcon name="ticket" size={30} color={colors.primaryText} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>
            Bienvenido a AI Ticket It
          </Text>
          <Text style={[styles.brandSub, { color: colors.muted }]}>
            Ingresá con tu cuenta para comprar entradas, chatear o publicar eventos.
          </Text>
        </View>

        {sessionExpiredMessage ? (
          <View
            testID="session-expired-banner"
            style={[styles.expiredBanner, { backgroundColor: colors.dangerBg }]}
          >
            <AppIcon name="clock" size={18} color={colors.dangerFg} />
            <Text style={[styles.expiredBannerText, { color: colors.dangerFg }]}>
              {sessionExpiredMessage}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          {(
            [
              ["login", "Iniciar Sesión"],
              ["register", "Registrarse"],
            ] as const
          ).map(([k, lbl]) => {
            const active = mode === k;
            return (
              <Pressable
                key={k}
                testID={`auth-mode-${k}`}
                onPress={() => {
                  setMode(k);
                  setError(null);
                }}
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
                  {lbl}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.grouped,
            {
              backgroundColor: colors.surface,
              boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
            },
          ]}
        >
          {mode === "register" ? (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  testID="auth-nombre"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
              <View
                style={[
                  styles.inputRow,
                  { borderTopWidth: 1, borderTopColor: colors.hairline },
                ]}
              >
                <TextInput
                  testID="auth-apellido"
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Apellido"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </>
          ) : null}

          <View
            style={[
              styles.inputRow,
              mode === "register" && {
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              },
            ]}
          >
            <TextInput
              testID="auth-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Correo electrónico"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <View
            style={[
              styles.inputRow,
              { borderTopWidth: 1, borderTopColor: colors.hairline },
            ]}
          >
            <TextInput
              testID="auth-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Contraseña"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.dangerFg }]} selectable>
            {error}
          </Text>
        ) : null}

        <Pressable
          testID="auth-submit-btn"
          disabled={loading}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              boxShadow: theme === "dark" ? shadows.darkCard : shadows.raised,
              opacity: loading ? 0.6 : pressed ? 0.88 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.submitBtnText, { color: colors.primaryText }]}>
              {mode === "login" ? "Ingresar" : "Crear cuenta"}
            </Text>
          )}
        </Pressable>

        <Pressable
          testID="profile-options-btn"
          onPress={() => router.push("/opciones")}
          style={[
            styles.guestOptionsBtn,
            { backgroundColor: colors.surface },
          ]}
        >
          <AppIcon name="settings" size={18} color={colors.primary} />
          <Text style={[styles.guestOptionsText, { color: colors.text }]}>
            Opciones · Tema y accesibilidad
          </Text>
          <AppIcon name="chevron" size={18} color={colors.muted} />
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.profileContent}
    >
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: colors.surface,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryText }]}>
            {getInitials(user.nombre, user.apellido)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.nombre} {user.apellido}
          </Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{user.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.muted }]}>
        PREFERENCIAS Y ACCESOS
      </Text>

      <View
        style={[
          styles.grouped,
          {
            backgroundColor: colors.surface,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          },
        ]}
      >
        <Pressable
          testID="profile-options-btn"
          onPress={() => router.push("/opciones")}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.soft }]}>
              <AppIcon name="settings" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Opciones · Tema y accesibilidad
            </Text>
          </View>
          <AppIcon name="chevron" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          testID="profile-my-events-btn"
          onPress={() => router.push("/mis-eventos")}
          style={({ pressed }) => [
            styles.menuRow,
            {
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
              <AppIcon name="calendar" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Mis Eventos (Organizador)
            </Text>
          </View>
          <AppIcon name="chevron" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          testID="profile-my-compras-btn"
          onPress={() => router.push("/mis-compras")}
          style={({ pressed }) => [
            styles.menuRow,
            {
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name="ticket" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Mis Compras
            </Text>
          </View>
          <AppIcon name="chevron" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable
        testID="profile-logout-btn"
        onPress={() => void logout()}
        style={({ pressed }) => [
          styles.logoutBtn,
          { backgroundColor: colors.dangerBg, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <AppIcon name="logout" size={18} color={colors.dangerFg} />
        <Text style={[styles.logoutText, { color: colors.dangerFg }]}>
          Cerrar sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  authContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  brandBlock: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.md },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: { fontSize: 20, fontWeight: "800", marginTop: spacing.xs },
  brandSub: { fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 19 },
  segmented: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  segmentText: { fontSize: 13, fontWeight: "800" },
  grouped: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  inputRow: { paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontSize: 15, paddingVertical: 2 },
  errorText: { fontSize: 12, fontWeight: "700" },
  expiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  expiredBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
  },
  submitBtnText: { fontSize: 15, fontWeight: "800" },
  guestOptionsBtn: {
    padding: 14,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  guestOptionsText: { flex: 1, fontSize: 14, fontWeight: "700" },
  profileContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  userCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: "800" },
  userEmail: { fontSize: 13 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  menuRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontWeight: "700" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  logoutText: { fontSize: 14, fontWeight: "800" },
});
