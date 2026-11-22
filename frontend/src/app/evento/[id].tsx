import { useLocalSearchParams } from "expo-router";
import React from "react";
import { EventoDetalleScreen } from "@/screens/evento-detalle-screen";

export default function EventoDetalleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventoDetalleScreen eventoId={Number(id)} />;
}
