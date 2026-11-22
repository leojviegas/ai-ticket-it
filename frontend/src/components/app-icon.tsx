import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, type SFSymbol } from "expo-symbols";
import React, { type ComponentProps } from "react";
import type { ColorValue } from "react-native";

type MaterialName = ComponentProps<typeof MaterialIcons>["name"];

const ICON_MAP = {
  home: { sf: "house.fill", md: "home" },
  heart: { sf: "heart", md: "favorite-border" },
  heartFill: { sf: "heart.fill", md: "favorite" },
  ticket: { sf: "ticket.fill", md: "confirmation-number" },
  chat: { sf: "bubble.left.and.bubble.right.fill", md: "chat" },
  user: { sf: "person.fill", md: "person" },
  calendar: { sf: "calendar", md: "calendar-month" },
  search: { sf: "magnifyingglass", md: "search" },
  sliders: { sf: "slider.horizontal.3", md: "tune" },
  back: { sf: "chevron.left", md: "arrow-back" },
  chevron: { sf: "chevron.right", md: "chevron-right" },
  trash: { sf: "trash", md: "delete-outline" },
  plus: { sf: "plus", md: "add" },
  minus: { sf: "minus", md: "remove" },
  clock: { sf: "clock", md: "schedule" },
  check: { sf: "checkmark", md: "check" },
  close: { sf: "xmark", md: "close" },
  refund: { sf: "arrow.uturn.left", md: "undo" },
  star: { sf: "star.fill", md: "star" },
  starOutline: { sf: "star", md: "star-border" },
  clip: { sf: "paperclip", md: "attach-file" },
  send: { sf: "paperplane.fill", md: "send" },
  file: { sf: "doc.fill", md: "description" },
  image: { sf: "photo", md: "image" },
  timeline: { sf: "point.topleft.down.curvedto.point.bottomright.up", md: "timeline" },
  settings: { sf: "gearshape.fill", md: "settings" },
  refresh: { sf: "arrow.clockwise", md: "refresh" },
  logout: { sf: "rectangle.portrait.and.arrow.right", md: "logout" },
} as const satisfies Record<string, { sf: SFSymbol; md: MaterialName }>;

export type AppIconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color: ColorValue;
}

export function AppIcon({ name, size = 20, color }: AppIconProps) {
  const entry = ICON_MAP[name];

  if (process.env.EXPO_OS === "ios") {
    return (
      <SymbolView
        name={entry.sf}
        tintColor={color}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
      />
    );
  }

  return <MaterialIcons name={entry.md} size={size} color={color as string} />;
}
