import Tabs from "expo-router/tabs";
import React from "react";
import { AppIcon } from "@/components/app-icon";
import { HeaderSwapButton } from "@/components/header-swap-button";
import { useMessaging } from "@/context/messaging-context";
import { usePreferences } from "@/context/preferences-context";

export default function TabsLayout() {
  const { colors, defaultMyEventsView } = usePreferences();
  const { hasUnread } = useMessaging();

  return (
    <Tabs
      screenOptions={{
        animation: "none",
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "800", fontSize: 17 },
        headerShadowVisible: false,
        headerRight: () => <HeaderSwapButton />,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "AI Ticket It",
          tabBarLabel: "Inicio",
          tabBarButtonTestID: "tab-inicio",
          tabBarIcon: ({ color }) => <AppIcon name="home" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="favoritos"
        options={{
          title: "Favoritos",
          tabBarLabel: "Favoritos",
          tabBarButtonTestID: "tab-favoritos",
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? "heartFill" : "heart"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="central"
        options={{
          title: defaultMyEventsView ? "Mis Eventos" : "Mis Compras",
          tabBarLabel: defaultMyEventsView ? "Mis Eventos" : "Compras",
          tabBarButtonTestID: "tab-central",
          tabBarIcon: ({ color }) => (
            <AppIcon
              name={defaultMyEventsView ? "calendar" : "ticket"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="mensajes"
        options={{
          title: "Mensajes",
          tabBarLabel: "Mensajes",
          tabBarButtonTestID: "tab-mensajes",
          tabBarBadge: hasUnread ? "" : undefined,
          tabBarBadgeStyle: hasUnread
            ? {
                backgroundColor: colors.alertDot,
                minWidth: 10,
                maxWidth: 10,
                height: 10,
                borderRadius: 5,
                marginTop: 2,
              }
            : undefined,
          tabBarIcon: ({ color }) => <AppIcon name="chat" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarButtonTestID: "tab-perfil",
          tabBarIcon: ({ color }) => <AppIcon name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
