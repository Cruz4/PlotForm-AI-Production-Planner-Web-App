// src/lib/themes.ts
import type { ThemeColorPalette, AppTheme } from '@/types';

// Standard Color Constants
export const WHITE = "#FFFFFF";
export const BLACK = "#000000";

// Standard neutrals and destructive colors (HEX)
export const STD_LIGHT_BG_HEX = WHITE;
export const STD_LIGHT_FG_HEX = "#111827"; // Tailwind's gray-900
export const STD_LIGHT_CARD_HEX = WHITE;
export const STD_LIGHT_POPOVER_HEX = WHITE;
export const STD_LIGHT_MUTED_HEX = "#F3F4F6"; // gray-100
export const STD_LIGHT_MUTED_FG_HEX = "#6B7280"; // gray-500
export const STD_LIGHT_BORDER_HEX = "#E5E7EB"; // gray-200
export const STD_LIGHT_INPUT_HEX = "#E5E7EB"; // gray-200
export const STD_DESTRUCTIVE_HEX_LIGHT = "#EF4444"; // red-500

export const STD_DARK_BG_HEX = "#111827"; // gray-900
export const STD_DARK_FG_HEX = "#F3F4F6"; // gray-100
export const STD_DARK_CARD_HEX = "#1F2937"; // gray-800
export const STD_DARK_POPOVER_HEX = "#1F2937"; // gray-800
export const STD_DARK_MUTED_HEX = "#374151"; // gray-700
export const STD_DARK_MUTED_FG_HEX = "#9CA3AF"; // gray-400
export const STD_DARK_BORDER_HEX = "#374151"; // gray-700
export const STD_DARK_INPUT_HEX = "#374151"; // gray-700
export const STD_DESTRUCTIVE_HEX_DARK = "#F87171"; // red-400

export const DEFAULT_CHART_COLORS_HEX = ["#A78BFA", "#7DD3FC", "#150734", "#F43F8A", "#FACD3D"];

export const hexToHsl = (hex: string): string => {
  if (!hex || typeof hex !== 'string' || (!hex.startsWith('#')) || (hex.length !== 4 && hex.length !== 7)) {
    console.warn(`Invalid hex color: "${hex}", defaulting to black.`);
    return "0 0% 0%";
  }
  let r_val = 0, g_val = 0, b_val = 0;
  if (hex.length === 4) {
    r_val = parseInt(hex[1] + hex[1], 16);
    g_val = parseInt(hex[2] + hex[2], 16);
    b_val = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r_val = parseInt(hex[1] + hex[2], 16);
    g_val = parseInt(hex[3] + hex[4], 16);
    b_val = parseInt(hex[5] + hex[6], 16);
  }

  const r = r_val / 255;
  const g = g_val / 255;
  const b = b_val / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
};

export const getContrastingForegroundFromHex = (backgroundHex: string): string => {
  if (!backgroundHex || typeof backgroundHex !== 'string' || (!backgroundHex.startsWith('#')) || (backgroundHex.length !== 4 && backgroundHex.length !== 7)) {
    return "0 0% 0%";
  }
  let r_val = 0, g_val = 0, b_val = 0;
  if (backgroundHex.length === 4) {
    r_val = parseInt(backgroundHex[1] + backgroundHex[1], 16);
    g_val = parseInt(backgroundHex[2] + backgroundHex[2], 16);
    b_val = parseInt(backgroundHex[3] + backgroundHex[3], 16);
  } else {
    r_val = parseInt(backgroundHex.substring(1, 3), 16);
    g_val = parseInt(backgroundHex.substring(3, 5), 16);
    b_val = parseInt(backgroundHex.substring(5, 7), 16);
  }
  const luminance = (0.299 * r_val + 0.587 * g_val + 0.114 * b_val) / 255;
  return luminance > 0.55 ? "0 0% 0%" : "0 0% 100%";
};

export function assignHexToRoles(hexList: string[]): { primaryHex: string; secondaryHex: string; accentHex: string; chartHexes: string[] } {
  const primaryHex = hexList[0] || DEFAULT_CHART_COLORS_HEX[0];
  const secondaryHex = hexList[1] || hexList[0] || DEFAULT_CHART_COLORS_HEX[1];
  const accentHex = hexList[2] || hexList[1] || hexList[0] || DEFAULT_CHART_COLORS_HEX[2];

  let chartHexesInternal = [...hexList];
  const finalChartHexes: string[] = [];
  for (let i = 0; i < 5; i++) {
    finalChartHexes.push(chartHexesInternal[i] || DEFAULT_CHART_COLORS_HEX[i % DEFAULT_CHART_COLORS_HEX.length]);
  }
  return { primaryHex, secondaryHex, accentHex, chartHexes: finalChartHexes.slice(0, 5) };
}

export function createStandardThemePalette(
  mode: 'light' | 'dark',
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  chartHexes: string[]
): ThemeColorPalette {
  const isDark = mode === 'dark';
  return {
    background: isDark ? hexToHsl(STD_DARK_BG_HEX) : hexToHsl(STD_LIGHT_BG_HEX),
    foreground: isDark ? hexToHsl(STD_DARK_FG_HEX) : hexToHsl(STD_LIGHT_FG_HEX),
    card: isDark ? hexToHsl(STD_DARK_CARD_HEX) : hexToHsl(STD_LIGHT_CARD_HEX),
    cardForeground: isDark ? hexToHsl(STD_DARK_FG_HEX) : hexToHsl(STD_LIGHT_FG_HEX),
    popover: isDark ? hexToHsl(STD_DARK_POPOVER_HEX) : hexToHsl(STD_LIGHT_POPOVER_HEX),
    popoverForeground: isDark ? hexToHsl(STD_DARK_FG_HEX) : hexToHsl(STD_LIGHT_FG_HEX),
    primary: hexToHsl(primaryHex),
    primaryForeground: getContrastingForegroundFromHex(primaryHex),
    secondary: hexToHsl(secondaryHex),
    secondaryForeground: getContrastingForegroundFromHex(secondaryHex),
    muted: isDark ? hexToHsl(STD_DARK_MUTED_HEX) : hexToHsl(STD_LIGHT_MUTED_HEX),
    mutedForeground: isDark ? hexToHsl(STD_DARK_MUTED_FG_HEX) : hexToHsl(STD_LIGHT_MUTED_FG_HEX),
    accent: hexToHsl(accentHex),
    accentForeground: getContrastingForegroundFromHex(accentHex),
    destructive: isDark ? hexToHsl(STD_DESTRUCTIVE_HEX_DARK) : hexToHsl(STD_DESTRUCTIVE_HEX_LIGHT),
    destructiveForeground: getContrastingForegroundFromHex(isDark ? STD_DESTRUCTIVE_HEX_DARK : STD_DESTRUCTIVE_HEX_LIGHT),
    border: isDark ? hexToHsl(STD_DARK_BORDER_HEX) : hexToHsl(STD_LIGHT_BORDER_HEX),
    input: isDark ? hexToHsl(STD_DARK_INPUT_HEX) : hexToHsl(STD_LIGHT_INPUT_HEX),
    ring: hexToHsl(primaryHex),
    chart1: hexToHsl(chartHexes[0]),
    chart2: hexToHsl(chartHexes[1]),
    chart3: hexToHsl(chartHexes[2]),
    chart4: hexToHsl(chartHexes[3]),
    chart5: hexToHsl(chartHexes[4]),
    sidebarBackground: isDark ? hexToHsl(STD_DARK_CARD_HEX) : hexToHsl(STD_LIGHT_MUTED_HEX),
    sidebarForeground: isDark ? hexToHsl(STD_DARK_FG_HEX) : hexToHsl(STD_LIGHT_FG_HEX),
    sidebarPrimary: hexToHsl(primaryHex),
    sidebarPrimaryForeground: getContrastingForegroundFromHex(primaryHex),
    sidebarAccent: hexToHsl(accentHex),
    sidebarAccentForeground: getContrastingForegroundFromHex(accentHex),
    sidebarBorder: isDark ? hexToHsl(STD_DARK_BORDER_HEX) : hexToHsl(STD_LIGHT_BORDER_HEX),
    sidebarRing: hexToHsl(primaryHex),
  };
}

export function createAppThemeFromCustomColors(
  name: string,
  id: string, // For unique className
  primaryHex: string,
  secondaryHex: string,
  accentHex: string
): AppTheme {
  const chartHexes = [
    primaryHex,
    secondaryHex,
    accentHex,
    DEFAULT_CHART_COLORS_HEX[3],
    DEFAULT_CHART_COLORS_HEX[4]
  ];

  return {
    name: name,
    className: `theme-custom-${id}`,
    light: createStandardThemePalette('light', primaryHex, secondaryHex, accentHex, chartHexes),
    dark: createStandardThemePalette('dark', primaryHex, secondaryHex, accentHex, chartHexes),
    originalHex: [primaryHex, secondaryHex, accentHex]
  };
}

// --- SPECIAL CASE: BREEZE CANDY ---
export const BREEZE_CANDY_HEX_MAP = { blue: "#4A5FC1", peach: "#E5B9A8", cyan: "#9CF6FB", darkBlue: "#394F8A", skyBlue: "#6BB7F3" };
export const BREEZE_CANDY_LIGHT_PALETTE: ThemeColorPalette = {
  background: hexToHsl("#E1FCFD"), foreground: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue),
  card: hexToHsl(WHITE), cardForeground: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue),
  popover: hexToHsl(WHITE), popoverForeground: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue),
  primary: hexToHsl(BREEZE_CANDY_HEX_MAP.blue), primaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.blue),
  secondary: hexToHsl(BREEZE_CANDY_HEX_MAP.peach), secondaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.peach),
  muted: hexToHsl("#EDF8F9"), mutedForeground: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue),
  accent: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue), accentForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.darkBlue),
  destructive: hexToHsl(STD_DESTRUCTIVE_HEX_LIGHT), destructiveForeground: getContrastingForegroundFromHex(STD_DESTRUCTIVE_HEX_LIGHT),
  border: hexToHsl("#C9F0F3"), input: hexToHsl("#C9F0F3"), ring: hexToHsl(BREEZE_CANDY_HEX_MAP.blue),
  chart1: hexToHsl(BREEZE_CANDY_HEX_MAP.blue), chart2: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), chart3: hexToHsl(BREEZE_CANDY_HEX_MAP.peach), chart4: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue), chart5: hexToHsl(BREEZE_CANDY_HEX_MAP.skyBlue),
  sidebarBackground: hexToHsl("#F5FCFC"), sidebarForeground: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue),
  sidebarPrimary: hexToHsl(BREEZE_CANDY_HEX_MAP.blue), sidebarPrimaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.blue),
  sidebarAccent: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue), sidebarAccentForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.darkBlue),
  sidebarBorder: hexToHsl("#C9F0F3"), sidebarRing: hexToHsl(BREEZE_CANDY_HEX_MAP.blue),
};
export const BREEZE_CANDY_DARK_PALETTE: ThemeColorPalette = {
  background: hexToHsl(BREEZE_CANDY_HEX_MAP.darkBlue), foreground: hexToHsl("#E1FCFD"),
  card: hexToHsl("#2A3F6F"), cardForeground: hexToHsl("#E1FCFD"),
  popover: hexToHsl("#2A3F6F"), popoverForeground: hexToHsl("#E1FCFD"),
  primary: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), primaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.cyan),
  secondary: hexToHsl(BREEZE_CANDY_HEX_MAP.peach), secondaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.peach),
  muted: hexToHsl("#20305A"), mutedForeground: hexToHsl("#B0E8EC"),
  accent: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), accentForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.cyan),
  destructive: hexToHsl(STD_DESTRUCTIVE_HEX_DARK), destructiveForeground: getContrastingForegroundFromHex(STD_DESTRUCTIVE_HEX_DARK),
  border: hexToHsl("#4A5A8A"), input: hexToHsl("#4A5A8A"), ring: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan),
  chart1: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), chart2: hexToHsl(BREEZE_CANDY_HEX_MAP.peach), chart3: hexToHsl(BREEZE_CANDY_HEX_MAP.blue), chart4: hexToHsl("#E1FCFD"), chart5: hexToHsl("#EDF8F9"),
  sidebarBackground: hexToHsl("#2A3F6F"), sidebarForeground: hexToHsl("#E1FCFD"),
  sidebarPrimary: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), sidebarPrimaryForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.cyan),
  sidebarAccent: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan), sidebarAccentForeground: getContrastingForegroundFromHex(BREEZE_CANDY_HEX_MAP.cyan),
  sidebarBorder: hexToHsl("#4A5A8A"), sidebarRing: hexToHsl(BREEZE_CANDY_HEX_MAP.cyan),
};

// --- ORIGINAL THEMES DEFINITIONS (excluding Breeze Candy, handled separately) ---
const ORIGINAL_THEMES_DEFINITIONS: { name: string; className: string; hex: string[]; darkPrimaryOverride?: string; darkAccentOverride?: string; darkSecondaryOverride?: string; darkChartHexesOverride?: (hexMap: Record<string, string>, darkPrimary: string, darkAccent: string, darkSecondary: string) => string[] }[] = [
  { name: "Prism Dash", className: "theme-prismdash", hex: ["#2CCCC3", "#5626C4", "#FACD3D", "#E60576", "#3B82F6"], darkSecondaryOverride: "#7C3AED", darkChartHexesOverride: (hexMap: any, _dp: any, _da: any, ds: any) => [hexMap.primary, hexMap.accent, ds, "#F43F8A", "#60A5FA"] },
  { name: "Zest Pulse", className: "theme-zestpulse", hex: ["#F15B42", "#7CAADC", "#FFD372", "#F49CC4", "#2C3D73"], darkPrimaryOverride: "#FFD372", darkAccentOverride: "#FFD372", darkChartHexesOverride: (hexMap: any, dp: any) => [dp, hexMap.secondary, hexMap.chart3, hexMap.primary, WHITE] },
  { name: "Navy Flame", className: "theme-navyflame", hex: ["#FF6A3D", "#9DAAF2", "#F4DB7D", "#1A2238", "#FF8C66"], darkPrimaryOverride: "#F4DB7D", darkAccentOverride: "#F4DB7D", darkChartHexesOverride: (hexMap: any, dp: any) => [dp, hexMap.primary, hexMap.secondary, WHITE, "#FFB099"] },
  { name: "Scarlet Brew", className: "theme-scarletbrew", hex: ["#AD1D45", "#50A8A8", "#F4B26A", "#725E4F", "#171D1C"], darkPrimaryOverride: "#F4B26A", darkAccentOverride: "#F4B26A", darkChartHexesOverride: (hexMap: any, dp: any) => [dp, hexMap.primary, hexMap.secondary, hexMap.chart3, "#FFF0E1"] },
  { name: "Eco Blast", className: "theme-ecoblast", hex: ["#4F7942", "#2E8B57", "#F0E68C", "#FF6347", "#90EE90"], darkPrimaryOverride: "#F0E68C", darkAccentOverride: "#F0E68C", darkChartHexesOverride: (hexMap: any, dp: any) => [dp, hexMap.secondary, hexMap.primary, hexMap.chart3, "#556B2F"] },
  { name: "Swell Metrics", className: "theme-swell-metrics", hex: ["#61C0BF", "#AAD9D9", "#FCDD76", "#E84855", "#9D9D9D"], darkPrimaryOverride: "#AAD9D9", darkAccentOverride: "#E84855", darkChartHexesOverride: (hexMap: any, dp: any, da: any) => [dp, hexMap.primary, da, hexMap.accent, hexMap.chart5] },
  { name: "Studio Sessions", className: "theme-studio-sessions", hex: ["#2C3E50", "#BDC3C7", "#E74C3C", "#3498DB", "#95A5A6"], darkPrimaryOverride: "#BDC3C7", darkAccentOverride: "#E74C3C" },
  { name: "Sage Flame", className: "theme-sageflame", hex: ["#A3B899", "#D4E2D4", "#F0A58F", "#6A7C64", "#E1C4B7"] },
  { name: "Blue Storm", className: "theme-color-storm", hex: ["#1857A4", "#59C4EB", "#FFCB0C", "#F05053", "#0D2F59"], darkPrimaryOverride: "#59C4EB", darkAccentOverride: "#FFCB0C", darkChartHexesOverride: (h:any,dp:string,da:string) => [dp, da, h.chart4, WHITE, h.chart3]},
  { name: "Magic Time", className: "theme-magic-time", hex: ["#16F4D0", "#AE9EFF", "#50E3C2", "#F43F8A", "#5E5CE6"], darkPrimaryOverride: "#AE9EFF", darkAccentOverride: "#50E3C2", darkChartHexesOverride: (h:any,dp:string,da:string) => [dp, da, h.chart4, h.primary, h.chart5]},
];

const PROCESSED_ORIGINAL_THEMES: AppTheme[] = ORIGINAL_THEMES_DEFINITIONS.map(def => {
  const { primaryHex, secondaryHex, accentHex, chartHexes } = assignHexToRoles(def.hex);
  const lightPalette = createStandardThemePalette('light', primaryHex, secondaryHex, accentHex, chartHexes);
  
  let darkPrimaryHex = def.darkPrimaryOverride || primaryHex;
  let darkAccentHex = def.darkAccentOverride || accentHex;
  let darkSecondaryHex = def.darkSecondaryOverride || secondaryHex;

  let darkChartArray = chartHexes;
  if (def.darkChartHexesOverride) {
    const hexMap = {primary: primaryHex, secondary: secondaryHex, accent: accentHex, chart3: chartHexes[2], chart4: chartHexes[3], chart5: chartHexes[4]};
    darkChartArray = def.darkChartHexesOverride(hexMap, darkPrimaryHex, darkAccentHex, darkSecondaryHex);
  } else {
    darkChartArray = [darkPrimaryHex, darkSecondaryHex, darkAccentHex, chartHexes[3] || DEFAULT_CHART_COLORS_HEX[3], chartHexes[4] || DEFAULT_CHART_COLORS_HEX[4]];
  }
  
  const darkPalette = createStandardThemePalette('dark', darkPrimaryHex, darkSecondaryHex, darkAccentHex, darkChartArray);
  return { name: def.name, className: def.className, light: lightPalette, dark: darkPalette, originalHex: def.hex };
});

export const BREEZE_CANDY_THEME: AppTheme = { name: "Breeze Candy", className: "theme-breezecandy", light: BREEZE_CANDY_LIGHT_PALETTE, dark: BREEZE_CANDY_DARK_PALETTE, originalHex: Object.values(BREEZE_CANDY_HEX_MAP) };
export const PRISM_DASH_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Prism Dash")!;
export const ZEST_PULSE_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Zest Pulse")!;
export const NAVY_FLAME_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Navy Flame")!;
export const SCARLET_BREW_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Scarlet Brew")!;
export const ECO_BLAST_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Eco Blast")!;
export const SWELL_METRICS_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Swell Metrics")!;
export const STUDIO_SESSIONS_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Studio Sessions")!;
export const SAGE_FLAME_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Sage Flame")!;
export const COLOR_STORM_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Blue Storm")!;
export const MAGIC_TIME_THEME = PROCESSED_ORIGINAL_THEMES.find(t => t.name === "Magic Time")!;


// --- NEW THEMES DEFINITIONS ---
const NEW_THEMES_DEFINITIONS: { name: string; className?: string; hex: string[] }[] = [
  { name: "Showtime", hex: ["#ff7b00", "#000c81", "#FACD3D"] },
  { name: "Busy Transactions", hex: ["#9fdf16", "#234417", "#32c89b"] },
  { name: "Technological Shine", hex: ["#00BFFF", "#1C2833", "#FF00FF"] },
  { name: "Gold Mine", hex: ["#2ff962", "#9f7709", "#FACD3D"] },
  { name: "Icy Orchid", hex: ["#6061A8", "#D3C5E5", "#8EC9BC", "#FBF5AA"] },
  { name: "Alpine Leaf", className: "theme-alpine-leaf", hex: ["#2963A2", "#4CAABC", "#72C2C9", "#9FA65A", "#22573D"] },
  { name: "Fog & Lavender", hex: ["#9882ac", "#E1E5EB", "#604d6e"] },
  { name: "Lemon Blush", hex: ["#C7395F", "#DED4E8", "#E8BA40"] },
  { name: "Candy Mirage", hex: ["#78FFC4", "#DCAAE4", "#FDC2E4", "#FAF3DE"] },
  { name: "Golden Orchid", hex: ["#FAEF7C", "#E3CCB2", "#E26274", "#78589F"] },
  { name: "Sunburn Drift", hex: ["#B6818B", "#57BBBC", "#B8912E", "#802621"] },
  { name: "Muted Dessert", hex: ["#D2385A", "#DE9DC2", "#9EE8E1", "#573C33"] },
  { name: "Blushwave", hex: ["#6FC7E1", "#EABDCF", "#EFD557", "#CE6EA3"] },
  { name: "Pop Petal", hex: ["#EFC6D4", "#D950AE", "#AAE847", "#EEEDEE"] },
  { name: "Lilac Smoke", hex: ["#D3CAE2", "#E6C17A", "#F6EDE3", "#404041"] },
  { name: "Earth Blush", hex: ["#D4B8B1", "#866C69", "#CD8C8C", "#53331F"] },
  { name: "Pastel Riot", hex: ["#F4B0F7", "#9CFAD4", "#EDF9A2", "#F8B0B3"] },
  { name: "Rust Grove", hex: ["#507B6A", "#6A513C", "#A4998E", "#4B1816"] },
  { name: "Solar Tide", hex: ["#E88659", "#D8BF58", "#D1BAA2", "#56C1E1"] },
  { name: "Impact Aid", hex: ["#F76035", "#FBD99D", "#90D6BB", "#91CAA9", "#A94323"] },
  { name: "Jester Gesture", className: "theme-jester-gesture", hex: ["#35e941", "#9373f2", "#e01f1f"] },
  { name: "Neon Midnight", className: "theme-neon-midnight", hex: ["#53fd94", "#601a39", "#f958b6"] },
  { name: "Neon Treats", hex: ["#8bc322", "#363636", "#c73c00"] },
  // New PlotForm Themes
  { name: "Plotting (PlotForm Default)", className: "theme-plotting-default", hex: ["#9aff29", "#28b4ff", "#28b4ff"] },
];

const GENERATED_NEW_THEMES: AppTheme[] = NEW_THEMES_DEFINITIONS.map(def => {
  const { primaryHex, secondaryHex, accentHex, chartHexes } = assignHexToRoles(def.hex);
  return {
    name: def.name,
    className: def.className || `theme-${def.name.toLowerCase().replace(/[\s()&]+/g, '-').replace(/[^a-z0-9-]+/g, '')}`,
    light: createStandardThemePalette('light', primaryHex, secondaryHex, accentHex, chartHexes),
    dark: createStandardThemePalette('dark', primaryHex, secondaryHex, accentHex, chartHexes),
    originalHex: def.hex
  };
});

// Export individual new themes
export const GOLD_MINE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Gold Mine")!;
export const ICY_ORCHID_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Icy Orchid")!;
export const ALPINE_LEAF_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Alpine Leaf")!;
export const FOG_LAVENDER_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Fog & Lavender")!;
export const LEMON_BLUSH_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Lemon Blush")!;
export const CANDY_MIRAGE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Candy Mirage")!;
export const GOLDEN_ORCHID_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Golden Orchid")!;
export const SUNBURN_DRIFT_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Sunburn Drift")!;
export const MUTED_DESSERT_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Muted Dessert")!;
export const BLUSHWAVE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Blushwave")!;
export const POP_PETAL_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Pop Petal")!;
export const LILAC_SMOKE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Lilac Smoke")!;
export const EARTH_BLUSH_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Earth Blush")!;
export const PASTEL_RIOT_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Pastel Riot")!;
export const RUST_GROVE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Rust Grove")!;
export const SOLAR_TIDE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Solar Tide")!;
export const IMPACT_AID_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Impact Aid")!;
export const JESTER_GESTURE_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Jester Gesture")!;
export const NEON_MIDNIGHT_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Neon Midnight")!;
export const NEON_TREATS_THEME = GENERATED_NEW_THEMES.find(t => t.name === "Neon Treats")!;


export const DEFAULT_THEME_NAME = "Plotting (PlotForm Default)";
export const PF_PLANNER_DEFAULT_THEME_NAME = "Plotting (PlotForm Default)";
// This list should contain the classNames of themes hardcoded in globals.css
export const PREDEFINED_THEME_CLASS_NAMES = [
  BREEZE_CANDY_THEME.className,
  ...PROCESSED_ORIGINAL_THEMES.map(t => t.className)
];

// Robust ALL_THEMES construction
const allDefinedThemes: AppTheme[] = [
  BREEZE_CANDY_THEME,
  ...PROCESSED_ORIGINAL_THEMES,
  ...GENERATED_NEW_THEMES,
];

const uniqueThemesMap = new Map<string, AppTheme>();
allDefinedThemes.forEach(theme => {
  if (theme && theme.name && !uniqueThemesMap.has(theme.name)) {
    uniqueThemesMap.set(theme.name, theme);
  }
});

let finalThemesList = Array.from(uniqueThemesMap.values());

const defaultThemeObject = finalThemesList.find(t => t.name === DEFAULT_THEME_NAME);
if (defaultThemeObject) {
  finalThemesList = [defaultThemeObject, ...finalThemesList.filter(t => t.name !== DEFAULT_THEME_NAME)];
} else {
  console.warn(`Default theme named "${DEFAULT_THEME_NAME}" not found in the constructed theme list. The first available theme will be used as default by the context.`);
  const fallbackDefault = GENERATED_NEW_THEMES.find(t => t.name === DEFAULT_THEME_NAME);
  if (fallbackDefault && !finalThemesList.some(t=>t.name === DEFAULT_THEME_NAME)) {
      finalThemesList.unshift(fallbackDefault);
      console.log(`Fallback: Added "${DEFAULT_THEME_NAME}" to the start of the themes list.`);
  }
}

export const ALL_THEMES: AppTheme[] = finalThemesList;
