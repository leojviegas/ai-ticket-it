import type { TextStyle } from "react-native";

export type ThemeMode = "light" | "dark";

export interface StatusColorTokens {
  bg: string;
  fg: string;
  border: string;
}

export type EstadoCompraKey =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "UTILIZADA"
  | "CANCELADA"
  | "REEMBOLSADA";

export interface AppThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  soft: string;
  softStrong: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  gold: string;
  warm: string;
  text: string;
  muted: string;
  hairline: string;
  tabBackground: string;
  tabPill: string;
  bubbleIn: string;
  bubbleOut: string;
  bubbleOutText: string;
  alertDot: string;
  dangerBg: string;
  dangerFg: string;
  borderWidth: number;
  status: Record<EstadoCompraKey, StatusColorTokens>;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  card: "0 3px 12px rgba(13, 59, 102, 0.08)",
  raised: "0 8px 24px rgba(13, 59, 102, 0.14)",
  darkCard: "0 4px 16px rgba(0, 0, 0, 0.28)",
} as const;

export const typography = {
  largeTitle: { fontSize: 26, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "700" },
  headline: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "400" },
  subhead: { fontSize: 13, fontWeight: "500" },
  caption: { fontSize: 11, fontWeight: "600" },
} as const satisfies Record<string, TextStyle>;

const lightBase: AppThemeColors = {
  background: "#F8F6F0",
  surface: "#FFFFFF",
  surfaceSecondary: "#F3EFE4",
  soft: "#FAF0CA",
  softStrong: "#F4E3A1",
  primary: "#0D3B66",
  primarySoft: "rgba(13, 59, 102, 0.10)",
  primaryText: "#FFFFFF",
  accent: "#F95738",
  accentSoft: "rgba(249, 87, 56, 0.12)",
  gold: "#F4D35E",
  warm: "#EE964B",
  text: "#0D2238",
  muted: "#5A6B7C",
  hairline: "rgba(13, 59, 102, 0.10)",
  tabBackground: "#FFFFFF",
  tabPill: "rgba(13, 59, 102, 0.12)",
  bubbleIn: "#FFFFFF",
  bubbleOut: "#0D3B66",
  bubbleOutText: "#FFFFFF",
  alertDot: "#F95738",
  dangerBg: "#FEE2E2",
  dangerFg: "#991B1B",
  borderWidth: 1,
  status: {
    PENDIENTE: { bg: "#FEF3C7", fg: "#92400E", border: "#F59E0B" },
    CONFIRMADA: { bg: "#DCFCE7", fg: "#166534", border: "#22C55E" },
    UTILIZADA: { bg: "#DBEAFE", fg: "#1E40AF", border: "#3B82F6" },
    CANCELADA: { bg: "#FEE2E2", fg: "#991B1B", border: "#EF4444" },
    REEMBOLSADA: { bg: "#EDE9FE", fg: "#5B21B6", border: "#8B5CF6" },
  },
};

const darkBase: AppThemeColors = {
  background: "#1D1E2C",
  surface: "#26283A",
  surfaceSecondary: "#303349",
  soft: "rgba(156, 82, 139, 0.22)",
  softStrong: "rgba(156, 82, 139, 0.36)",
  primary: "#B86CA6",
  primarySoft: "rgba(184, 108, 166, 0.20)",
  primaryText: "#FFFFFF",
  accent: "#9C528B",
  accentSoft: "rgba(156, 82, 139, 0.26)",
  gold: "#F4D35E",
  warm: "#EE964B",
  text: "#FFFFFF",
  muted: "#D7CDCC",
  hairline: "rgba(215, 205, 204, 0.14)",
  tabBackground: "#212333",
  tabPill: "rgba(184, 108, 166, 0.24)",
  bubbleIn: "#2E3147",
  bubbleOut: "#9C528B",
  bubbleOutText: "#FFFFFF",
  alertDot: "#F87171",
  dangerBg: "rgba(239, 68, 68, 0.20)",
  dangerFg: "#FCA5A5",
  borderWidth: 1,
  status: {
    PENDIENTE: { bg: "rgba(245, 158, 11, 0.18)", fg: "#FCD34D", border: "#F59E0B" },
    CONFIRMADA: { bg: "rgba(34, 197, 94, 0.18)", fg: "#86EFAC", border: "#22C55E" },
    UTILIZADA: { bg: "rgba(59, 130, 246, 0.18)", fg: "#93C5FD", border: "#3B82F6" },
    CANCELADA: { bg: "rgba(239, 68, 68, 0.18)", fg: "#FCA5A5", border: "#EF4444" },
    REEMBOLSADA: { bg: "rgba(168, 85, 247, 0.18)", fg: "#D8B4FE", border: "#A855F7" },
  },
};

const okabeLightStatus: Record<EstadoCompraKey, StatusColorTokens> = {
  PENDIENTE: { bg: "rgba(230, 159, 0, 0.20)", fg: "#8A5300", border: "#E69F00" },
  CONFIRMADA: { bg: "rgba(0, 114, 178, 0.15)", fg: "#005587", border: "#0072B2" },
  UTILIZADA: { bg: "rgba(86, 180, 233, 0.22)", fg: "#0369A1", border: "#56B4E9" },
  CANCELADA: { bg: "rgba(213, 94, 0, 0.16)", fg: "#9A3E00", border: "#D55E00" },
  REEMBOLSADA: { bg: "rgba(204, 121, 167, 0.22)", fg: "#7D2B59", border: "#CC79A7" },
};

const okabeDarkStatus: Record<EstadoCompraKey, StatusColorTokens> = {
  PENDIENTE: { bg: "rgba(230, 159, 0, 0.22)", fg: "#FBBF24", border: "#E69F00" },
  CONFIRMADA: { bg: "rgba(0, 114, 178, 0.24)", fg: "#60A5FA", border: "#0072B2" },
  UTILIZADA: { bg: "rgba(86, 180, 233, 0.22)", fg: "#7DD3FC", border: "#56B4E9" },
  CANCELADA: { bg: "rgba(213, 94, 0, 0.24)", fg: "#FB923C", border: "#D55E00" },
  REEMBOLSADA: { bg: "rgba(204, 121, 167, 0.24)", fg: "#F472B6", border: "#CC79A7" },
};

export function resolveThemeColors(mode: ThemeMode, colorblind: boolean): AppThemeColors {
  const base = mode === "dark" ? darkBase : lightBase;
  if (!colorblind) {
    return base;
  }
  return {
    ...base,
    borderWidth: 2,
    alertDot: "#D55E00",
    dangerBg: mode === "dark" ? "rgba(213, 94, 0, 0.24)" : "rgba(213, 94, 0, 0.16)",
    dangerFg: mode === "dark" ? "#FB923C" : "#9A3E00",
    status: mode === "dark" ? okabeDarkStatus : okabeLightStatus,
  };
}
