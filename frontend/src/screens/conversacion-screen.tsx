import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import { ErrorView, LoadingView } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/context/auth-context";
import { useMessaging } from "@/context/messaging-context";
import { usePreferences } from "@/context/preferences-context";
import { ApiError } from "@/services/api";
import { compraService } from "@/services/compra-service";
import { mensajeService } from "@/services/mensaje-service";
import { radius, shadows, spacing } from "@/theme";
import type { AdjuntoMensaje, Compra, Mensaje, TipoMimeAdjunto } from "@/types/api";
import { extractErrorMessage, formatTimeOnly } from "@/utils/format";

const POLLING_CHAT_MS = 10000;

function normalizeMimeType(mime?: string | null, fileName?: string): TipoMimeAdjunto {
  const lower = (mime || "").toLowerCase();
  if (lower === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower === "image/png" || fileName?.toLowerCase().endsWith(".png")) {
    return "image/png";
  }
  if (lower === "image/webp" || fileName?.toLowerCase().endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

function decodeBase64ToBytes(base64Data: string): Uint8Array {
  const clean = base64Data.includes(",") ? base64Data.split(",")[1] ?? "" : base64Data;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i += 1) {
    lookup[chars.charCodeAt(i)] = i;
  }
  const len = clean.length;
  let padding = 0;
  if (len > 0 && clean[len - 1] === "=") padding += 1;
  if (len > 1 && clean[len - 2] === "=") padding += 1;

  const bytes = new Uint8Array((len * 3) / 4 - padding);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[clean.charCodeAt(i)];
    const encoded2 = lookup[clean.charCodeAt(i + 1)];
    const encoded3 = lookup[clean.charCodeAt(i + 2)];
    const encoded4 = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (i + 2 < len && clean[i + 2] !== "=") {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (i + 3 < len && clean[i + 3] !== "=") {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }
  return bytes;
}

export function ConversacionScreen({ compraId }: { compraId: number }) {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user, isHydrated, redirectToLogin } = useAuth();
  const { markInboxAsRead, refreshConversations } = useMessaging();
  const insets = useSafeAreaInsets();

  const [compra, setCompra] = useState<Compra | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [texto, setTexto] = useState("");
  const [adjuntoPendiente, setAdjuntoPendiente] = useState<AdjuntoMensaje | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [androidKeyboardPadding, setAndroidKeyboardPadding] = useState(0);

  const listRef = useRef<FlatList<Mensaje>>(null);
  const rootHeightRef = useRef(0);
  const maxRootHeightRef = useRef(0);
  const keyboardHeightRef = useRef(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOpen(true);
      const kbHeight = e.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = kbHeight;

      if (Platform.OS === "android") {
        // En Edge-to-Edge (Expo Go Android 15+) el sistema puede no achicar la ventana:
        // solo sumamos padding si la altura del contenedor no se redujo al menos 100px.
        const shrunkByOs = maxRootHeightRef.current - rootHeightRef.current >= 100;
        setAndroidKeyboardPadding(shrunkByOs ? 0 : kbHeight);
      }

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardOpen(false);
      setAndroidKeyboardPadding(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRootLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    rootHeightRef.current = h;
    if (h > maxRootHeightRef.current) {
      maxRootHeightRef.current = h;
    }
    if (Platform.OS === "android" && keyboardHeightRef.current > 0) {
      const shrunkByOs = maxRootHeightRef.current - h >= 100;
      if (shrunkByOs) {
        setAndroidKeyboardPadding(0);
      }
    }
  };

  const userId = user?.id ?? null;

  useEffect(() => {
    if (isHydrated && !userId) {
      redirectToLogin();
    }
  }, [isHydrated, userId, redirectToLogin]);

  const cargarInicial = useCallback(async () => {
    if (isHydrated && !userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await compraService.obtenerPorId(compraId);
      setCompra(data);
      setMensajes(data.mensajes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [compraId, isHydrated, userId, redirectToLogin]);

  const refrescarMensajes = useCallback(async () => {
    try {
      const lista = await mensajeService.listar({ compraId });
      setMensajes(lista);
      await markInboxAsRead();
    } catch {
      // Ignoramos errores transitorios de polling
    }
  }, [compraId, markInboxAsRead]);

  useEffect(() => {
    void cargarInicial();
  }, [cargarInicial]);

  useFocusEffect(
    useCallback(() => {
      void markInboxAsRead();
      const id = setInterval(() => {
        if (AppState.currentState === "active") {
          void refrescarMensajes();
        }
      }, POLLING_CHAT_MS);
      return () => clearInterval(id);
    }, [markInboxAsRead, refrescarMensajes])
  );

  const handlePickImage = async () => {
    setAttachSheetOpen(false);
    setSendError(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        base64: true,
      });
      if (res.canceled || !res.assets[0]) {
        return;
      }
      const asset = res.assets[0];
      if (!asset.base64) {
        setSendError("No se pudo leer la imagen seleccionada en formato base64.");
        return;
      }
      const nombre = asset.fileName || `comprobante_${Date.now()}.jpg`;
      const tipoMime = normalizeMimeType(asset.mimeType, nombre);
      setAdjuntoPendiente({
        nombre,
        tipoMime,
        contenido: `data:${tipoMime};base64,${asset.base64}`,
      });
    } catch (err) {
      setSendError(extractErrorMessage(err));
    }
  };

  const handlePickPdf = async () => {
    setAttachSheetOpen(false);
    setSendError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        base64: true,
      });
      if (res.canceled || !res.assets[0]) {
        return;
      }
      const asset = res.assets[0];
      let base64 = asset.base64;
      if (!base64 && Platform.OS !== "web") {
        const file = new File(asset.uri);
        base64 = await file.base64();
      }
      if (!base64) {
        setSendError("No se pudo leer el documento PDF seleccionado.");
        return;
      }
      const cleanBase64 = base64.includes(",") ? base64.split(",")[1] ?? "" : base64;
      setAdjuntoPendiente({
        nombre: asset.name || `comprobante_${Date.now()}.pdf`,
        tipoMime: "application/pdf",
        contenido: `data:application/pdf;base64,${cleanBase64}`,
      });
    } catch (err) {
      setSendError(extractErrorMessage(err));
    }
  };

  const handleOpenAttachment = async (adjunto: AdjuntoMensaje) => {
    if (adjunto.tipoMime.startsWith("image/")) {
      setPreviewImageUri(adjunto.contenido);
      return;
    }
    try {
      if (Platform.OS === "web") {
        const win = (globalThis as any).window;
        if (win?.open) {
          win.open(adjunto.contenido, "_blank");
        }
        return;
      }
      const safeName = adjunto.nombre.replace(/[^a-zA-Z0-9._-]/g, "_");
      const tempFile = new File(Paths.cache, `${Date.now()}_${safeName}`);
      tempFile.create({ overwrite: true });
      tempFile.write(decodeBase64ToBytes(adjunto.contenido));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempFile.uri, { mimeType: adjunto.tipoMime });
      }
    } catch (err) {
      setSendError(extractErrorMessage(err));
    }
  };

  const handleSend = async () => {
    const trimmed = texto.trim();
    if (!trimmed && !adjuntoPendiente) {
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await compraService.agregarMensaje(compraId, {
        mensaje: trimmed,
        adjunto: adjuntoPendiente,
      });
      setMensajes(res.compra.mensajes);
      setCompra(res.compra);
      setTexto("");
      setAdjuntoPendiente(null);
      void refreshConversations();
      void markInboxAsRead();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setSendError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading && !compra) {
    return <LoadingView message="Abriendo conversación..." />;
  }

  if (error || !compra) {
    return (
      <ErrorView
        message={error || "No pudimos abrir esta conversación."}
        onRetry={() => void cargarInicial()}
      />
    );
  }

  const contraparte =
    user?.id === compra.comprador.id ? compra.evento.organizador : compra.comprador;

  const isOrganizer = user?.id === compra.evento.organizador.id;

  return (
    <KeyboardAvoidingView
      onLayout={handleRootLayout}
      style={[
        styles.root,
        { backgroundColor: colors.background },
        Platform.OS === "android" && androidKeyboardPadding > 0
          ? { paddingBottom: androidKeyboardPadding }
          : null,
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
    >
      <Pressable
        testID="chat-event-banner"
        onPress={() =>
          router.push(
            isOrganizer ? `/gestionar-evento/${compra.evento.id}` : `/evento/${compra.evento.id}`
          )
        }
        style={({ pressed }) => [
          styles.topStrip,
          { backgroundColor: colors.soft, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.topStripLeft}>
          <Text style={[styles.stripTitle, { color: colors.text }]} numberOfLines={1}>
            {compra.evento.nombre} · {contraparte.nombre} {contraparte.apellido}
          </Text>
          <Text style={[styles.stripSub, { color: colors.muted }]}>
            {compra.cantidad}x {compra.tipoEntrada.nombre}
            {isOrganizer ? " · Tocar para gestionar" : " · Ver evento"}
          </Text>
        </View>
        <View style={styles.topStripRight}>
          <StatusBadge estado={compra.estado} />
          <AppIcon name="chevron" size={16} color={colors.muted} />
        </View>
      </Pressable>

      <FlatList
        ref={listRef}
        data={mensajes}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const mine = item.remitente.id === user?.id;
          return (
            <View style={[styles.bubbleRow, mine ? styles.alignEnd : styles.alignStart]}>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? colors.bubbleOut : colors.bubbleIn,
                    boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
                  },
                  mine ? styles.bubbleMineRadius : styles.bubbleOtherRadius,
                ]}
              >
                {item.mensaje ? (
                  <Text
                    selectable
                    style={[
                      styles.bubbleText,
                      { color: mine ? colors.bubbleOutText : colors.text },
                    ]}
                  >
                    {item.mensaje}
                  </Text>
                ) : null}

                {item.adjunto ? (
                  <Pressable
                    onPress={() => void handleOpenAttachment(item.adjunto!)}
                    style={[
                      styles.attachmentBox,
                      {
                        backgroundColor: mine
                          ? "rgba(255,255,255,0.16)"
                          : colors.surfaceSecondary,
                      },
                    ]}
                  >
                    {item.adjunto.tipoMime.startsWith("image/") ? (
                      <Image
                        source={{ uri: item.adjunto.contenido }}
                        style={styles.attachmentThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.pdfBadge,
                          {
                            backgroundColor: mine
                              ? "rgba(255,255,255,0.22)"
                              : colors.soft,
                          },
                        ]}
                      >
                        <AppIcon
                          name="file"
                          size={18}
                          color={mine ? "#FFFFFF" : colors.primary}
                        />
                      </View>
                    )}
                    <View style={styles.attachmentMeta}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.attachmentName,
                          { color: mine ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {item.adjunto.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.attachmentHint,
                          { color: mine ? "rgba(255,255,255,0.78)" : colors.muted },
                        ]}
                      >
                        {item.adjunto.tipoMime === "application/pdf"
                          ? "PDF · Tocar para abrir"
                          : "Imagen · Tocar para ampliar"}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}

                <Text
                  style={[
                    styles.bubbleTime,
                    { color: mine ? "rgba(255,255,255,0.75)" : colors.muted },
                  ]}
                >
                  {formatTimeOnly(item.enviado)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, { color: colors.muted }]}>
              Escribí tu primer mensaje o adjuntá un comprobante para iniciar la conversación.
            </Text>
          </View>
        }
      />

      {sendError ? (
        <Text style={[styles.sendError, { color: colors.dangerFg }]}>{sendError}</Text>
      ) : null}

      {adjuntoPendiente ? (
        <View
          style={[
            styles.pendingBar,
            { backgroundColor: colors.soft, borderTopColor: colors.hairline },
          ]}
        >
          <AppIcon
            name={adjuntoPendiente.tipoMime === "application/pdf" ? "file" : "image"}
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.pendingName, { color: colors.text }]} numberOfLines={1}>
            {adjuntoPendiente.nombre}
          </Text>
          <Pressable onPress={() => setAdjuntoPendiente(null)} hitSlop={8}>
            <AppIcon name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.hairline,
            paddingBottom: keyboardOpen
              ? spacing.sm
              : Math.max(insets.bottom, spacing.sm),
          },
        ]}
      >
        <Pressable
          testID="chat-attach-btn"
          onPress={() => setAttachSheetOpen(true)}
          accessibilityLabel="Adjuntar comprobante"
          style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <AppIcon name="clip" size={20} color={colors.primary} />
        </Pressable>

        <TextInput
          testID="chat-input"
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribir mensaje..."
          placeholderTextColor={colors.muted}
          multiline
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text },
          ]}
        />

        <Pressable
          testID="chat-send-btn"
          disabled={sending || (texto.trim() === "" && !adjuntoPendiente)}
          onPress={() => void handleSend()}
          accessibilityLabel="Enviar mensaje"
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.primary,
              opacity:
                sending || (texto.trim() === "" && !adjuntoPendiente) ? 0.45 : 1,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <AppIcon name="send" size={18} color={colors.primaryText} />
          )}
        </Pressable>
      </View>

      <BottomSheet
        visible={attachSheetOpen}
        onClose={() => setAttachSheetOpen(false)}
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          Adjuntar comprobante
        </Text>
        <View style={styles.attachGrid}>
          <Pressable
            onPress={() => void handlePickImage()}
            style={[styles.attachOption, { backgroundColor: colors.background }]}
          >
            <AppIcon name="image" size={28} color={colors.primary} />
            <Text style={[styles.attachLabel, { color: colors.text }]}>
              Imagen (JPG / PNG)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handlePickPdf()}
            style={[styles.attachOption, { backgroundColor: colors.background }]}
          >
            <AppIcon name="file" size={28} color={colors.accent} />
            <Text style={[styles.attachLabel, { color: colors.text }]}>
              Documento PDF
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={previewImageUri !== null}
        onClose={() => setPreviewImageUri(null)}
      >
        {previewImageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: previewImageUri }}
              style={styles.previewImage}
              contentFit="contain"
            />
          </View>
        ) : null}
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topStrip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  topStripLeft: { flex: 1, gap: 2 },
  topStripRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  stripTitle: { fontSize: 13, fontWeight: "800" },
  stripSub: { fontSize: 11 },
  messagesList: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  bubbleRow: { flexDirection: "row" },
  alignEnd: { justifyContent: "flex-end" },
  alignStart: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  bubbleMineRadius: { borderBottomRightRadius: 4 },
  bubbleOtherRadius: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  attachmentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: 8,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  pdfBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentMeta: { flex: 1, gap: 2 },
  attachmentName: { fontSize: 12, fontWeight: "700" },
  attachmentHint: { fontSize: 10 },
  bubbleTime: {
    fontSize: 10,
    alignSelf: "flex-end",
    fontVariant: ["tabular-nums"],
  },
  emptyChat: {
    flex: 1,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyChatText: { fontSize: 13, textAlign: "center", maxWidth: 260 },
  sendError: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  pendingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  pendingName: { flex: 1, fontSize: 12, fontWeight: "700" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800" },
  attachGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  attachOption: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  attachLabel: { fontSize: 13, fontWeight: "700" },
  previewContainer: {
    height: 360,
    width: "100%",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
  },
});
