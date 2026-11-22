import React from "react";
import { TabFocusWrapper } from "@/components/tab-focus-wrapper";
import { MensajesScreen } from "@/screens/mensajes-screen";

export default function MensajesRoute() {
  return (
    <TabFocusWrapper>
      <MensajesScreen />
    </TabFocusWrapper>
  );
}
