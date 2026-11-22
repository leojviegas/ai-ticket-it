import React from "react";
import { TabFocusWrapper } from "@/components/tab-focus-wrapper";
import { InicioScreen } from "@/screens/inicio-screen";

export default function InicioRoute() {
  return (
    <TabFocusWrapper>
      <InicioScreen />
    </TabFocusWrapper>
  );
}
