import React from "react";
import { TabFocusWrapper } from "@/components/tab-focus-wrapper";
import { PerfilScreen } from "@/screens/perfil-screen";

export default function PerfilRoute() {
  return (
    <TabFocusWrapper>
      <PerfilScreen />
    </TabFocusWrapper>
  );
}
