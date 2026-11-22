import { useLocalSearchParams } from "expo-router";
import React from "react";
import { PerfilOrganizadorScreen } from "@/screens/perfil-organizador-screen";

export default function OrganizadorRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PerfilOrganizadorScreen organizadorId={Number(id)} />;
}
