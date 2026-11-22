import { useIsFocused } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

export function TabFocusWrapper({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();
  if (Platform.OS === "web" && !isFocused) {
    return null;
  }
  if (Platform.OS === "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return <>{children}</>;
}
