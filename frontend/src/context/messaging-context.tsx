import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "@/context/auth-context";
import { mensajeService } from "@/services/mensaje-service";
import type { Conversacion } from "@/types/api";

const LAST_READ_PREFIX = "ai_ticket_it_msg_read_";
const HIDDEN_CHATS_PREFIX = "ai_ticket_it_msg_hidden_";
const POLLING_INTERVAL_MS = 10000;

interface MessagingContextValue {
  conversaciones: Conversacion[];
  visibleConversaciones: Conversacion[];
  hiddenCount: number;
  hasUnread: boolean;
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
  markInboxAsRead: () => Promise<void>;
  hideConversation: (compraId: number, lastMessageId: number | null) => Promise<void>;
  restoreHiddenConversations: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

function latestIncomingTimestamp(convs: Conversacion[], userId: number): number {
  let latest = 0;
  for (const conv of convs) {
    for (const msg of conv.mensajes) {
      if (msg.remitente.id !== userId) {
        const ts = new Date(msg.enviado).getTime();
        if (ts > latest) {
          latest = ts;
        }
      }
    }
  }
  return latest;
}

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const [hiddenMap, setHiddenMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const appStateRef = useRef<AppStateStatus>(
    (AppState.currentState ?? "active") as AppStateStatus
  );

  const userId = user?.id ?? null;

  // Hidrata estado local de lectura y chats ocultos al cambiar de usuario
  useEffect(() => {
    if (!userId) {
      setConversaciones([]);
      setLastReadAt(0);
      setHiddenMap({});
      return;
    }
    let active = true;
    Promise.all([
      AsyncStorage.getItem(`${LAST_READ_PREFIX}${userId}`),
      AsyncStorage.getItem(`${HIDDEN_CHATS_PREFIX}${userId}`),
    ])
      .then(([rawRead, rawHidden]) => {
        if (!active) {
          return;
        }
        setLastReadAt(rawRead ? Number(rawRead) || 0 : 0);
        setHiddenMap(rawHidden ? (JSON.parse(rawHidden) as Record<string, number>) : {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userId]);

  const refreshConversations = useCallback(async () => {
    if (!userId || !token) {
      return;
    }
    try {
      const data = await mensajeService.listarConversaciones(false);
      setConversaciones(data);
    } catch {
      // Silenciamos fallos transitorios del polling para no interrumpir al usuario
    }
  }, [userId, token]);

  useEffect(() => {
    if (!userId || !token) {
      return;
    }
    let mounted = true;
    setIsLoading(true);
    refreshConversations().finally(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    const intervalId = setInterval(() => {
      if (appStateRef.current === "active") {
        void refreshConversations();
      }
    }, POLLING_INTERVAL_MS);

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev !== "active" && nextState === "active") {
        void refreshConversations();
      }
    });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      sub.remove();
    };
  }, [userId, token, refreshConversations]);

  const markInboxAsRead = useCallback(async () => {
    if (!userId) {
      return;
    }
    const latestIncoming = latestIncomingTimestamp(conversaciones, userId);
    const nextTs = Math.max(Date.now(), latestIncoming);
    setLastReadAt(nextTs);
    await AsyncStorage.setItem(`${LAST_READ_PREFIX}${userId}`, String(nextTs)).catch(() => {});
  }, [userId, conversaciones]);

  const hideConversation = useCallback(
    async (compraId: number, lastMessageId: number | null) => {
      if (!userId) {
        return;
      }
      const next = { ...hiddenMap, [String(compraId)]: lastMessageId ?? 0 };
      setHiddenMap(next);
      await AsyncStorage.setItem(`${HIDDEN_CHATS_PREFIX}${userId}`, JSON.stringify(next)).catch(
        () => {}
      );
    },
    [userId, hiddenMap]
  );

  const restoreHiddenConversations = useCallback(async () => {
    if (!userId) {
      return;
    }
    setHiddenMap({});
    await AsyncStorage.removeItem(`${HIDDEN_CHATS_PREFIX}${userId}`).catch(() => {});
  }, [userId]);

  const visibleConversaciones = useMemo(() => {
    return conversaciones.filter((conv) => {
      const hiddenAtMsgId = hiddenMap[String(conv.compraId)];
      if (hiddenAtMsgId === undefined) {
        return true;
      }
      // Si entró un mensaje nuevo posterior al que había cuando se ocultó, vuelve a mostrarse
      const currentLastId = conv.ultimoMensaje?.id ?? 0;
      return currentLastId > hiddenAtMsgId;
    });
  }, [conversaciones, hiddenMap]);

  const hiddenCount = conversaciones.length - visibleConversaciones.length;

  const hasUnread = useMemo(() => {
    if (!userId) {
      return false;
    }
    return latestIncomingTimestamp(visibleConversaciones, userId) > lastReadAt;
  }, [userId, visibleConversaciones, lastReadAt]);

  const value = useMemo<MessagingContextValue>(
    () => ({
      conversaciones,
      visibleConversaciones,
      hiddenCount,
      hasUnread,
      isLoading,
      refreshConversations,
      markInboxAsRead,
      hideConversation,
      restoreHiddenConversations,
    }),
    [
      conversaciones,
      visibleConversaciones,
      hiddenCount,
      hasUnread,
      isLoading,
      refreshConversations,
      markInboxAsRead,
      hideConversation,
      restoreHiddenConversations,
    ]
  );

  return <MessagingContext value={value}>{children}</MessagingContext>;
}

export function useMessaging(): MessagingContextValue {
  const ctx = use(MessagingContext);
  if (!ctx) {
    throw new Error("useMessaging debe usarse dentro de MessagingProvider");
  }
  return ctx;
}
