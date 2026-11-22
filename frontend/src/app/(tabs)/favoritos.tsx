import React from "react";
import { TabFocusWrapper } from "@/components/tab-focus-wrapper";
import { FavoritosScreen } from "@/screens/favoritos-screen";

export default function FavoritosRoute() {
  return (
    <TabFocusWrapper>
      <FavoritosScreen />
    </TabFocusWrapper>
  );
}
