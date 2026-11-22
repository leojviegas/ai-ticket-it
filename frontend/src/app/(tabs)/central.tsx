import React from "react";
import { usePreferences } from "@/context/preferences-context";
import { MisComprasScreen } from "@/screens/mis-compras-screen";
import { MisEventosScreen } from "@/screens/mis-eventos-screen";

export default function CentralTabRoute() {
  const { defaultMyEventsView } = usePreferences();
  return defaultMyEventsView ? <MisEventosScreen /> : <MisComprasScreen />;
}
