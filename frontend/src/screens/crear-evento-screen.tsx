import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAuth } from "@/context/auth-context";
import { usePreferences } from "@/context/preferences-context";
import { categoriaService } from "@/services/categoria-service";
import { eventoService } from "@/services/evento-service";
import { radius, shadows, spacing } from "@/theme";
import type { Categoria } from "@/types/api";
import { extractErrorMessage, formatDateTime } from "@/utils/format";

interface DraftTipoEntrada {
  key: string;
  nombre: string;
  descripcion: string;
  precio: string;
  cupo: string;
}

export function CrearEventoScreen() {
  const router = useRouter();
  const { colors, theme } = usePreferences();
  const { user, verifySession } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/(tabs)/perfil");
        return;
      }
      void verifySession().catch(() => {});
    }, [user, verifySession, router])
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  const [fecha, setFecha] = useState<Date>(() => new Date(Date.now() + 86400000 * 7));
  const [androidPickerMode, setAndroidPickerMode] = useState<"date" | "time" | null>(null);
  const [webDateStr, setWebDateStr] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 7);
    return d.toISOString().slice(0, 10);
  });
  const [webTimeStr, setWebTimeStr] = useState("21:00");

  const [multimedia, setMultimedia] = useState<string[]>([]);
  const [tiposEntrada, setTiposEntrada] = useState<DraftTipoEntrada[]>([
    {
      key: "1",
      nombre: "General",
      descripcion: "Acceso general",
      precio: "15000",
      cupo: "100",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriaService
      .listar()
      .then((cats) => {
        setCategorias(cats);
        if (cats[0]) {
          setCategoriaId((prev) => prev ?? cats[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      const currentMode = androidPickerMode;
      setAndroidPickerMode(null);
      if (event.type !== "set" || !selected) {
        return;
      }
      if (currentMode === "date") {
        const next = new Date(fecha);
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setFecha(next);
      } else if (currentMode === "time") {
        const next = new Date(fecha);
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setFecha(next);
      }
      return;
    }

    if (selected) {
      setFecha(selected);
    }
  };

  const handlePickGallery = async () => {
    setError(null);
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
        setError("No pudimos procesar la imagen seleccionada.");
        return;
      }
      const rawMime = (asset.mimeType || "image/jpeg").toLowerCase();
      const mime =
        rawMime === "image/jpg"
          ? "image/jpeg"
          : ["image/jpeg", "image/png", "image/webp"].includes(rawMime)
            ? rawMime
            : "image/jpeg";
      setMultimedia((prev) => [...prev, `data:${mime};base64,${asset.base64}`]);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const updateTipo = (key: string, field: keyof DraftTipoEntrada, value: string) => {
    setTiposEntrada((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
  };

  const addTipo = () => {
    setTiposEntrada((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        nombre: "",
        descripcion: "",
        precio: "",
        cupo: "",
      },
    ]);
  };

  const removeTipo = (key: string) => {
    setTiposEntrada((prev) => prev.filter((t) => t.key !== key));
  };

  const handlePublish = async () => {
    setError(null);
    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completá el nombre y la descripción del evento.");
      return;
    }
    if (!categoriaId) {
      setError("Seleccioná una categoría.");
      return;
    }

    let fechaFinal = fecha;
    if (Platform.OS === "web") {
      const parsed = new Date(`${webDateStr}T${webTimeStr}:00`);
      if (Number.isNaN(parsed.getTime())) {
        setError("Ingresá una fecha y hora válidas (YYYY-MM-DD y HH:MM).");
        return;
      }
      fechaFinal = parsed;
    }

    const parsedTipos = tiposEntrada.map((t) => ({
      nombre: t.nombre.trim(),
      descripcion: t.descripcion.trim(),
      precio: Number(t.precio),
      cupo: Number(t.cupo),
    }));

    if (
      parsedTipos.some(
        (t) =>
          !t.nombre ||
          !t.descripcion ||
          Number.isNaN(t.precio) ||
          t.precio < 0 ||
          !Number.isInteger(t.cupo) ||
          t.cupo < 1
      )
    ) {
      setError("Revisá que cada tipo de entrada tenga nombre, descripción, precio y cupo entero >= 1.");
      return;
    }

    setSubmitting(true);
    try {
      const creado = await eventoService.crear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaId,
        fecha: fechaFinal.toISOString(),
        multimedia,
        tiposEntrada: parsedTipos,
      });
      router.replace(`/gestionar-evento/${creado.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.grouped,
          {
            backgroundColor: colors.surface,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
          },
        ]}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.muted }]}>NOMBRE DEL EVENTO</Text>
          <TextInput
            testID="create-nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Noche de Jazz en Vivo"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text }]}
          />
        </View>

        <View
          style={[
            styles.field,
            { borderTopWidth: 1, borderTopColor: colors.hairline },
          ]}
        >
          <Text style={[styles.label, { color: colors.muted }]}>DESCRIPCIÓN</Text>
          <TextInput
            testID="create-descripcion"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
            placeholder="Contá de qué trata tu evento, ubicación, artistas..."
            placeholderTextColor={colors.muted}
            style={[styles.inputMultiline, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categorias.map((cat) => {
            const active = categoriaId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoriaId(cat.id)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.primary : colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primaryText : colors.text },
                  ]}
                >
                  {cat.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Fecha y hora del evento
        </Text>

        {Platform.OS === "web" ? (
          <View style={styles.webDateRow}>
            <TextInput
              value={webDateStr}
              onChangeText={setWebDateStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[
                styles.webInput,
                { backgroundColor: colors.surface, color: colors.text },
              ]}
            />
            <TextInput
              value={webTimeStr}
              onChangeText={setWebTimeStr}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
              style={[
                styles.webInput,
                { backgroundColor: colors.surface, color: colors.text },
              ]}
            />
          </View>
        ) : Platform.OS === "ios" ? (
          <View style={[styles.iosPickerBox, { backgroundColor: colors.surface }]}>
            <DateTimePicker
              value={fecha}
              mode="datetime"
              minimumDate={new Date()}
              onChange={handlePickerChange}
            />
          </View>
        ) : (
          <View style={styles.androidDateRow}>
            <Pressable
              onPress={() => setAndroidPickerMode("date")}
              style={[styles.dateBtn, { backgroundColor: colors.surface }]}
            >
              <AppIcon name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.dateBtnText, { color: colors.text }]}>
                {formatDateTime(fecha.toISOString()).split("·")[0]}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setAndroidPickerMode("time")}
              style={[styles.dateBtn, { backgroundColor: colors.surface }]}
            >
              <AppIcon name="clock" size={18} color={colors.primary} />
              <Text style={[styles.dateBtnText, { color: colors.text }]}>
                {formatDateTime(fecha.toISOString()).split("·")[1]?.trim()}
              </Text>
            </Pressable>

            {androidPickerMode ? (
              <DateTimePicker
                value={fecha}
                mode={androidPickerMode}
                minimumDate={new Date()}
                onChange={handlePickerChange}
              />
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Multimedia (Galería JPG / PNG)
        </Text>
        <View style={styles.galleryRow}>
          {multimedia.map((uri, index) => (
            <View key={`${index}-${uri.slice(-12)}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
              <Pressable
                onPress={() =>
                  setMultimedia((prev) => prev.filter((_, idx) => idx !== index))
                }
                style={[styles.thumbRemove, { backgroundColor: colors.dangerFg }]}
              >
                <AppIcon name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => void handlePickGallery()}
            accessibilityLabel="Agregar imagen de galería"
            style={[
              styles.addPhotoBtn,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          >
            <AppIcon name="plus" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.tiposHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tipos de Entrada
          </Text>
          <Pressable onPress={addTipo}>
            <Text style={[styles.addTipoLink, { color: colors.primary }]}>
              + Agregar tipo
            </Text>
          </Pressable>
        </View>

        {tiposEntrada.map((tipo, index) => (
          <View
            key={tipo.key}
            style={[
              styles.tipoCard,
              {
                backgroundColor: colors.surface,
                boxShadow: theme === "dark" ? shadows.darkCard : shadows.card,
              },
            ]}
          >
            <View style={styles.tipoCardTop}>
              <Text style={[styles.tipoIndex, { color: colors.primary }]}>
                Entrada #{index + 1}
              </Text>
              {tiposEntrada.length > 1 ? (
                <Pressable onPress={() => removeTipo(tipo.key)} hitSlop={8}>
                  <AppIcon name="trash" size={18} color={colors.dangerFg} />
                </Pressable>
              ) : null}
            </View>

            <TextInput
              value={tipo.nombre}
              onChangeText={(v) => updateTipo(tipo.key, "nombre", v)}
              placeholder="Nombre (ej. General, VIP)"
              placeholderTextColor={colors.muted}
              style={[
                styles.tipoInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
            />
            <TextInput
              value={tipo.descripcion}
              onChangeText={(v) => updateTipo(tipo.key, "descripcion", v)}
              placeholder="Descripción breve"
              placeholderTextColor={colors.muted}
              style={[
                styles.tipoInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
            />

            <View style={styles.tipoNumRow}>
              <TextInput
                value={tipo.precio}
                onChangeText={(v) => updateTipo(tipo.key, "precio", v)}
                keyboardType="numeric"
                placeholder="Precio ($)"
                placeholderTextColor={colors.muted}
                style={[
                  styles.tipoInput,
                  styles.flex1,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
              />
              <TextInput
                value={tipo.cupo}
                onChangeText={(v) => updateTipo(tipo.key, "cupo", v)}
                keyboardType="numeric"
                placeholder="Cupo"
                placeholderTextColor={colors.muted}
                style={[
                  styles.tipoInput,
                  styles.flex1,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.dangerFg }]} selectable>
          {error}
        </Text>
      ) : null}

      <Pressable
        testID="publish-event-btn"
        disabled={submitting}
        onPress={() => void handlePublish()}
        style={({ pressed }) => [
          styles.publishBtn,
          {
            backgroundColor: colors.primary,
            boxShadow: theme === "dark" ? shadows.darkCard : shadows.raised,
            opacity: submitting ? 0.6 : pressed ? 0.88 : 1,
          },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={[styles.publishBtnText, { color: colors.primaryText }]}>
            Publicar evento
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  grouped: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  field: {
    padding: 14,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  input: { fontSize: 15, fontWeight: "700", paddingVertical: 2 },
  inputMultiline: {
    fontSize: 14,
    minHeight: 68,
    textAlignVertical: "top",
  },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  chipsRow: { gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
  chipText: { fontSize: 12, fontWeight: "700" },
  webDateRow: { flexDirection: "row", gap: spacing.sm },
  webInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    fontSize: 14,
    fontWeight: "600",
  },
  iosPickerBox: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    alignItems: "flex-start",
  },
  androidDateRow: { flexDirection: "row", gap: spacing.sm },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: 13,
    borderRadius: radius.lg,
    borderCurve: "continuous",
  },
  dateBtnText: { fontSize: 13, fontWeight: "700" },
  galleryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumbWrap: { width: 76, height: 76, position: "relative" },
  thumbImg: { width: 76, height: 76, borderRadius: radius.md },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  tiposHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addTipoLink: { fontSize: 13, fontWeight: "800" },
  tipoCard: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: 14,
    gap: spacing.sm,
  },
  tipoCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tipoIndex: { fontSize: 13, fontWeight: "800" },
  tipoInput: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  tipoNumRow: { flexDirection: "row", gap: spacing.sm },
  flex1: { flex: 1 },
  errorText: { fontSize: 12, fontWeight: "700" },
  publishBtn: {
    paddingVertical: 15,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    alignItems: "center",
  },
  publishBtnText: { fontSize: 15, fontWeight: "800" },
});
