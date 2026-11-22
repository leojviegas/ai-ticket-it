import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useRouter,
} from "expo-router";
import Stack from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MessagingProvider } from "@/context/messaging-context";
import {
  PreferencesProvider,
  usePreferences,
} from "@/context/preferences-context";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const {
    theme,
    colors,
    defaultMyEventsView,
    isHydrated: prefsHydrated,
  } = usePreferences();
  const { user, isHydrated: authHydrated } = useAuth();
  const didInitialRoute = useRef(false);

  const ready = prefsHydrated && authHydrated;

  useEffect(() => {
    if (!ready) {
      return;
    }
    void SplashScreen.hideAsync();
    if (!didInitialRoute.current) {
      didInitialRoute.current = true;
      if (user && defaultMyEventsView) {
        router.replace("/(tabs)/central");
      }
    }
  }, [ready, user, defaultMyEventsView, router]);

  if (!ready) {
    return null;
  }

  const navTheme =
    theme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            primary: colors.primary,
            border: colors.hairline,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            primary: colors.primary,
            border: colors.hairline,
          },
        };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="evento/[id]"
          options={{ title: "Detalle del Evento" }}
        />
        <Stack.Screen
          name="organizador/[id]"
          options={{ title: "Perfil del Organizador" }}
        />
        <Stack.Screen name="chat/[compraId]" options={{ title: "Conversación" }} />
        <Stack.Screen name="mis-eventos" options={{ title: "Mis Eventos" }} />
        <Stack.Screen name="mis-compras" options={{ title: "Mis Compras" }} />
        <Stack.Screen name="crear-evento" options={{ title: "Crear Evento" }} />
        <Stack.Screen
          name="gestionar-evento/[id]"
          options={{ title: "Gestionar Evento" }}
        />
        <Stack.Screen
          name="opciones"
          options={{ title: "Tema y accesibilidad" }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <AuthProvider>
            <MessagingProvider>
              <RootNavigator />
            </MessagingProvider>
          </AuthProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
