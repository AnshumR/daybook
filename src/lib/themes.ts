export type ThemeId = "chai" | "blue" | "green" | "warm" | "lavender" | "mono";
/** "time" follows the clock: morning, afternoon, evening, night. */
export type Mode = "time" | "system" | "light" | "dark";

type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  high: string;
  medium: string;
  /** Colour for ticked items; defaults to the accent. */
  done?: string;
};

export const THEMES: Record<ThemeId, { name: string; light: Palette; dark: Palette; day?: Palette; evening?: Palette }> = {
  chai: {
    name: "Chai & paper",
    light: { bg: "#FAF3E7", card: "#FFFBF4", ink: "#3B2A20", muted: "#7A604E", line: "#EADBC4", accent: "#B4532F", accentInk: "#FFFFFF", high: "#B4432A", medium: "#8E6208", done: "#5E7D55" },
    day: { bg: "#FBF7F0", card: "#FFFFFF", ink: "#3B2A20", muted: "#76604F", line: "#EDE2D3", accent: "#B4532F", accentInk: "#FFFFFF", high: "#B4432A", medium: "#8E6208", done: "#5E7D55" },
    evening: { bg: "#F7E4D4", card: "#FFF5EC", ink: "#3E2A2A", muted: "#7A5A50", line: "#EBCDB8", accent: "#A9472E", accentInk: "#FFFFFF", high: "#A23A24", medium: "#86590A", done: "#5E7D55" },
    dark: { bg: "#1D1611", card: "#2A211A", ink: "#F3E7D8", muted: "#BCA791", line: "#3D3027", accent: "#E08A5F", accentInk: "#1D1611", high: "#F08B6E", medium: "#E2B552", done: "#9DBB92" },
  },
  blue: {
    name: "Calm blue",
    light: { bg: "#F5F7FB", card: "#FFFFFF", ink: "#141B2D", muted: "#5E6B82", line: "#E1E6F0", accent: "#3B6FE0", accentInk: "#FFFFFF", high: "#E5533D", medium: "#C98A12" },
    dark: { bg: "#0E1424", card: "#161E33", ink: "#E8EDF7", muted: "#93A0B8", line: "#263049", accent: "#6E9BFF", accentInk: "#0B1220", high: "#FF7A66", medium: "#E8B54A" },
  },
  green: {
    name: "Forest green",
    light: { bg: "#F3F5F2", card: "#FFFFFF", ink: "#18221E", muted: "#5D6B65", line: "#DCE3DE", accent: "#1E6B57", accentInk: "#FFFFFF", high: "#B4441F", medium: "#9A6A08" },
    dark: { bg: "#0F1513", card: "#18201D", ink: "#E7EDE9", muted: "#97A59F", line: "#2B3632", accent: "#4FB592", accentInk: "#0B1411", high: "#E5835F", medium: "#D9A641" },
  },
  warm: {
    name: "Warm notebook",
    light: { bg: "#FBF7F0", card: "#FFFDF8", ink: "#2A211B", muted: "#7A6B5E", line: "#EADFD2", accent: "#C2603A", accentInk: "#FFFFFF", high: "#B23A2E", medium: "#A7700B" },
    dark: { bg: "#1C1814", card: "#26201A", ink: "#F1E8DE", muted: "#A89886", line: "#3A3028", accent: "#E08A5F", accentInk: "#1C1814", high: "#F07A6A", medium: "#E0B04F" },
  },
  lavender: {
    name: "Lavender",
    light: { bg: "#F6F5FB", card: "#FFFFFF", ink: "#1E1B2E", muted: "#6A6681", line: "#E4E1F0", accent: "#6D5BD0", accentInk: "#FFFFFF", high: "#D9485F", medium: "#B7800F" },
    dark: { bg: "#13121C", card: "#1C1B29", ink: "#ECEAF6", muted: "#9C98B5", line: "#2C2A40", accent: "#9D8CFF", accentInk: "#13121C", high: "#FF7A8C", medium: "#E2B552" },
  },
  mono: {
    name: "Minimal",
    light: { bg: "#FFFFFF", card: "#FAFAFA", ink: "#111111", muted: "#6B6B6B", line: "#E6E6E6", accent: "#111111", accentInk: "#FFFFFF", high: "#FF4D2E", medium: "#B07A00" },
    dark: { bg: "#000000", card: "#111111", ink: "#F2F2F2", muted: "#9A9A9A", line: "#262626", accent: "#F2F2F2", accentInk: "#000000", high: "#FF6B4F", medium: "#E0B04F" },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = "chai";
export const DEFAULT_MODE: Mode = "time";
const STORAGE_KEY = "daybook.theme";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && v in THEMES;
}
export function isMode(v: unknown): v is Mode {
  return v === "time" || v === "system" || v === "light" || v === "dark";
}

// Plain JS so the same code can run inline in <head> before first paint.
const APPLY_SOURCE = `function(themes, theme, mode) {
  var t = themes[theme] || themes.chai;
  var h = new Date().getHours();
  var dark, p;
  if (mode === "time") {
    dark = h >= 21 || h < 5;
    p = dark ? t.dark : h >= 17 ? (t.evening || t.light) : h >= 11 ? (t.day || t.light) : t.light;
  } else {
    dark = mode === "dark" || (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    p = dark ? t.dark : t.light;
  }
  var s = document.documentElement.style;
  s.setProperty("--bg", p.bg); s.setProperty("--card", p.card); s.setProperty("--ink", p.ink);
  s.setProperty("--muted", p.muted); s.setProperty("--line", p.line); s.setProperty("--accent", p.accent);
  s.setProperty("--accent-ink", p.accentInk); s.setProperty("--high", p.high); s.setProperty("--medium", p.medium);
  s.setProperty("--done", p.done || p.accent);
  s.colorScheme = dark ? "dark" : "light";
  document.documentElement.setAttribute("data-mode", dark ? "dark" : "light");
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metas.length; i++) { metas[i].setAttribute("content", p.bg); }
}`;

// eslint-disable-next-line @typescript-eslint/no-implied-eval
const applyPalette = new Function("return " + APPLY_SOURCE)() as (themes: typeof THEMES, theme: ThemeId, mode: Mode) => void;

export function applyTheme(theme: ThemeId, mode: Mode) {
  applyPalette(THEMES, theme, mode);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, mode }));
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
}

/** Inline <head> script: applies the last-used theme before the page paints. */
export const THEME_BOOT_SCRIPT = `(function(){try{
  var themes = ${JSON.stringify(THEMES)};
  var saved = {}; try { saved = JSON.parse(localStorage.getItem("${STORAGE_KEY}") || "{}"); } catch (e) {}
  (${APPLY_SOURCE})(themes, saved.theme || "${DEFAULT_THEME}", saved.mode || "${DEFAULT_MODE}");
}catch(e){}})();`;

/** Part of the day, for greetings. */
export function partOfDay(d: Date = new Date()): "morning" | "afternoon" | "evening" | "night" {
  const h = d.getHours();
  return h >= 21 || h < 5 ? "night" : h >= 17 ? "evening" : h >= 12 ? "afternoon" : "morning";
}
