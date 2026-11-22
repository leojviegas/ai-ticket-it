import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ConversacionScreen } from "@/screens/conversacion-screen";

export default function ChatCompraRoute() {
  const { compraId } = useLocalSearchParams<{ compraId: string }>();
  return <ConversacionScreen compraId={Number(compraId)} />;
}
