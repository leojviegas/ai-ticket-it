import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { usePreferences } from "@/context/preferences-context";
import { radius, shadows, spacing } from "@/theme";

export function OpcionesScreen() {
  const {
    theme,
    colorblind,
    showMyEventsBtn,
    defaultMyEventsView,
    colors,
    setTheme,
    setColorblind,
    setShowMyEventsBtn,
    setDefaultMyEventsView,
  } = usePreferences();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionHeader, { color: colors.muted }]}>APARIENCIA</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          },
        ]}
      >
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          Tema de la aplicación
        </Text>
        <View style={styles.themeRow}>
          <Pressable
            onPress={() => setTheme("light")}
            style={[
              styles.themeBtn,
              {
                backgroundColor:
                  theme === "light" ? colors.primary : colors.surfaceSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.themeBtnText,
                { color: theme === "light" ? colors.primaryText : colors.text },
              ]}
            >
              Claro (Predet.)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTheme("dark")}
            style={[
              styles.themeBtn,
              {
                backgroundColor:
                  theme === "dark" ? colors.primary : colors.surfaceSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.themeBtnText,
                { color: theme === "dark" ? colors.primaryText : colors.text },
              ]}
            >
              Oscuro
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.muted }]}>
        TEMA Y ACCESIBILIDAD
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
        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Modo daltónico
            </Text>
            <Text style={[styles.rowDesc, { color: colors.muted }]}>
              Aplica paleta segura Okabe-Ito y refuerza bordes e iconos en todos los estados.
            </Text>
          </View>
          <Switch value={colorblind} onValueChange={setColorblind} />
        </View>

        <View
          style={[
            styles.switchRow,
            { borderTopWidth: 1, borderTopColor: colors.hairline },
          ]}
        >
          <View style={styles.switchTextCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Elegir "Mis Eventos" como vista predeterminada
            </Text>
            <Text style={[styles.rowDesc, { color: colors.muted }]}>
              Pensado para organizadores: coloca Mis Eventos en la barra inferior en lugar de Mis Compras, y mueve Mis Compras al botón superior derecho.
            </Text>
          </View>
          <Switch
            value={defaultMyEventsView}
            onValueChange={setDefaultMyEventsView}
          />
        </View>

        <View
          style={[
            styles.switchRow,
            {
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              opacity: defaultMyEventsView ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.switchTextCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Mostrar botón Mis Eventos
            </Text>
            <Text style={[styles.rowDesc, { color: colors.muted }]}>
              {defaultMyEventsView
                ? "Ya se muestra en la barra inferior como vista predeterminada."
                : "Si no tenés planeado organizar eventos a futuro, para tu comodidad podés deshabilitar este botón de la interfaz principal."}
            </Text>
          </View>
          <Switch
            value={showMyEventsBtn}
            disabled={defaultMyEventsView}
            onValueChange={setShowMyEventsBtn}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.md,
    gap: spacing.sm,
  },
  themeRow: { flexDirection: "row", gap: spacing.sm },
  themeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderCurve: "continuous",
    alignItems: "center",
  },
  themeBtnText: { fontSize: 13, fontWeight: "800" },
  grouped: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  switchRow: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  switchTextCol: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: "800" },
  rowDesc: { fontSize: 12, lineHeight: 17 },
});
