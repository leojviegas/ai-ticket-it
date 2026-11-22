import { useLocalSearchParams } from "expo-router";
import React from "react";
import { GestionEventoScreen } from "@/screens/gestion-evento-screen";

export default function GestionEventoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GestionEventoScreen eventoId={Number(id)} />;
}
