/*
 * Theme token model for the multi-theme surface.
 *
 * A "theme" here is a full surface family — ground, sidebar, toolbar, the
 * surface ramp, borders and the text ramp — not an accent swap. Each theme
 * declares a ground hue and a saturation profile; the neutral ramp is
 * re-hued from the reference (claude) ramp, which is hand-tuned and known
 * good, and every text/background pair is then tuned until it clears
 * WCAG AA.
 *
 * `claude` is the default and is emitted as an exact identity of the
 * reference values — it is the brand, and none of its hexes move.
 *
 * Accent seeds and the AA discipline come from the APIARY design lab's
 * gen_palettes.py; the ground-tinting and the neutral ramp are new. Hue
 * directions follow the 2026 dashboard colour research recorded with the
 * original presets: zinc/slate neutrals, earth/clay, digital lavender,
 * fintech lime, restrained neon on dark.
 *
 * Zero dependencies, like the rest of scripts/.
 */

/* ── colour maths ─────────────────────────────────────────────────── */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

export function relLuminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/* Accepts #rgb/#rrggbb and rgb()/rgba(). Returns [r, g, b, a] — alpha
   matters: several shipped tokens (the dark focus ring, every *-soft) are
   semi-transparent, and comparing their raw channels to a backdrop would
   measure a colour that never appears on screen. */
export function parseColor(value) {
  if (Array.isArray(value)) return value.length === 4 ? value : [...value, 1];
  const v = String(value).trim();
  const fn = v.match(/^rgba?\(([^)]+)\)$/i);
  if (fn) {
    const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  let h = v.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [...hexToRgb(`#${h}`), 1];
}

/* Contrast of `a` against `b`. If `a` is translucent it is first flattened
   over `b`, which is how it actually renders. */
export function contrast(a, b) {
  const bg = parseColor(b).slice(0, 3);
  const fa = parseColor(a);
  const fg = fa[3] >= 1 ? fa.slice(0, 3) : fa.slice(0, 3).map((c, i) => c * fa[3] + bg[i] * (1 - fa[3]));
  const la = relLuminance(fg);
  const lb = relLuminance(bg);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* Flattens `fg` at `alpha` over an opaque `bg` — the realistic backdrop for
   every *-soft token, which is what the original a11y pass found failing. */
export function composite(fg, alpha, bg) {
  const f = parseColor(fg).slice(0, 3);
  const b = parseColor(bg).slice(0, 3);
  return f.map((c, i) => c * alpha + b[i] * (1 - alpha));
}

/* Re-hues a colour onto `hue`, scaling saturation and shifting lightness.
   Hue/sat of `null` means "leave untouched" — how claude stays identical. */
export function retint(hex, { hue, satMul = 1, lightShift = 0 }) {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  const nh = hue === null || hue === undefined ? h : hue;
  const ns = Math.max(0, Math.min(1, s * satMul));
  const nl = Math.max(0, Math.min(1, l + lightShift));
  return rgbToHex(...hslToRgb(nh, ns, nl));
}

export function shiftLightness(hex, delta) {
  const [h, s, l] = rgbToHsl(...parseColor(hex).slice(0, 3));
  return rgbToHex(...hslToRgb(h, s, Math.max(0, Math.min(1, l + delta))));
}

/* Walks lightness until `color` clears `target` against `bg`, or gives up
   and returns the best it reached (the caller reports the shortfall).

   Callers tune to AIM, not to the 4.5 floor. Stopping exactly on the floor
   is what the original a11y pass called "a thin pass… one shade from
   failing", and it retuned for roughly a 5.3:1 margin instead. Same idea
   here: the checker asserts 4.5, the generator aims past it. */
/* How far a status colour is pulled toward the theme's ground hue. Small on
   purpose -- see the STATUS block in buildMode(). */
export const HUE_PULL = 0.14;
/* The near-black ink solid status badges are drawn with. */
export const BADGE_INK = '#0d2417';

export const AIM = 5.1;
export const AIM_NONTEXT = 3.4;

export function tune(color, bg, { target = AIM, direction = 1, maxSteps = 90, step = 0.01 } = {}) {
  let c = color;
  for (let i = 0; i < maxSteps; i += 1) {
    if (contrast(c, bg) >= target) return c;
    const next = shiftLightness(c, step * direction);
    if (next === c) break;
    c = next;
  }
  return c;
}

/* ── the reference ramp ───────────────────────────────────────────── */

/* claude's shipped values. Every other theme is a re-tint of these, so the
   ramp's internal relationships (how far surface-2 sits above surface-1,
   how the borders read) are preserved across the whole set. */
export const REFERENCE = {
  dark: {
    'bg-000': '#20201f',
    'bg-sidebar': '#1e1e1c',
    'bg-toolbar': '#242422',
    'bg-100': '#242422',
    'bg-200': '#2c2c2a',
    'bg-300': '#343432',
    'bg-400': '#3d3d3b',
    'bg-500': '#42423f',
    'bg-raised': '#383835',
    'text-000': '#e9e6df',
    'text-100': '#a8a49c',
    'text-200': '#a5a9a6',
    'text-300': '#68635e',
    'btn-inverted-bg': '#f5f4ef',
    'btn-inverted-bg-hover': '#ffffff',
    'btn-inverted-text': '#161513',
    'border-rgb': '#ffffff',
    'border-subtle-a': 0.05,
    'border-strong-a': 0.11,
    'overlay-rgb': '#000000',
    'overlay-a': 0.5,
    'shadow-rgb': '#000000',
  },
  light: {
    'bg-000': '#f7f6f2',
    'bg-sidebar': '#f0efeb',
    'bg-toolbar': '#f5f4f0',
    'bg-100': '#fbfaf7',
    'bg-200': '#f4f2ed',
    'bg-300': '#ebe9e3',
    'bg-400': '#e1dfd8',
    'bg-500': '#e9e7e1',
    'bg-raised': '#fffefa',
    'text-000': '#2f2b27',
    'text-100': '#68615a',
    'text-200': '#66615b',
    'text-300': '#aaa49d',
    'btn-inverted-bg': '#262421',
    'btn-inverted-bg-hover': '#151412',
    'btn-inverted-text': '#f5f4ef',
    'border-rgb': '#221f1c',
    'border-subtle-a': 0.07,
    'border-strong-a': 0.14,
    'overlay-rgb': '#221f1c',
    'overlay-a': 0.36,
    'shadow-rgb': '#302a24',
  },
};

/*
 * claude's shipped values, verbatim.
 *
 * claude is the brand and the default, and its palette is hand-tuned in
 * ways a generator should not second-guess: links are blue rather than
 * accent-derived, --accent-soft sits at 0.14/0.12 rather than the
 * 0.16/0.13 the presets use, and the focus ring, soft ink and inverted
 * button family all carry values that were measured against real rendered
 * pages. Those are decisions, not derivations.
 *
 * The link family (--text-link, --text-link-hover, --switch-on,
 * --border-focus) is deliberately NOT pinned: those values were blue rather
 * than accent-derived, and the light one measured 3.95:1 against
 * --bg-200, failing AA on every link on every page (#103). They are now
 * derived and AA-tuned like every other theme's.
 *
 * So the rest of claude is pinned here rather than generated, and
 * assertIdentity() fails the build if anything drifts. Every other theme is generated from
 * the reference ramp and tuned.
 */
export const CLAUDE_IDENTITY = {
  light: {
    'bg-000': '#f7f6f2',
    'bg-sidebar': '#f0efeb',
    'bg-toolbar': '#f5f4f0',
    'bg-100': '#fbfaf7',
    'bg-200': '#f4f2ed',
    'bg-300': '#ebe9e3',
    'bg-400': '#e1dfd8',
    'bg-500': '#e9e7e1',
    'bg-raised': '#fffefa',
    'border-100': 'rgba(34, 31, 28, 0.07)',
    'border-200': 'rgba(34, 31, 28, 0.14)',
    'text-000': '#2f2b27',
    'text-100': '#68615a',
    'text-200': '#66615b',
    'text-300': '#aaa49d',
    'accent': '#af593f',
    'accent-hover': '#a34d35',
    'accent-pressed': '#93422d',
    'accent-soft': 'rgba(199, 101, 72, 0.12)',
    'accent-text-on-soft': '#a2472b',
    'text-on-accent': '#fffaf5',
    'btn-inverted-bg': '#262421',
    'btn-inverted-bg-hover': '#151412',
    'btn-inverted-text': '#f5f4ef',
    'overlay-bg': 'rgba(34, 31, 28, 0.36)',
  },
  dark: {
    'bg-000': '#20201f',
    'bg-sidebar': '#1e1e1c',
    'bg-toolbar': '#242422',
    'bg-100': '#242422',
    'bg-200': '#2c2c2a',
    'bg-300': '#343432',
    'bg-400': '#3d3d3b',
    'bg-500': '#42423f',
    'bg-raised': '#383835',
    'border-100': 'rgba(255, 255, 255, 0.05)',
    'border-200': 'rgba(255, 255, 255, 0.11)',
    'text-000': '#e9e6df',
    'text-100': '#a8a49c',
    'text-200': '#a5a9a6',
    'text-300': '#68635e',
    'accent': '#d97757',
    'accent-hover': '#e18768',
    'accent-pressed': '#c9684b',
    'accent-soft': 'rgba(217, 119, 87, 0.14)',
    'accent-text-on-soft': '#e38f74',
    'text-on-accent': '#211a17',
    'btn-inverted-bg': '#f5f4ef',
    'btn-inverted-bg-hover': '#ffffff',
    'btn-inverted-text': '#161513',
    'overlay-bg': 'rgba(0, 0, 0, 0.5)',
  },
};

/* Tokens a theme owns. Everything else — spacing, radii, type scale,
   motion, layout dimensions, the semantic status ramp — is shared and
   lives outside the theme blocks. */
export const SURFACE_KEYS = [
  'bg-000', 'bg-sidebar', 'bg-toolbar',
  'bg-100', 'bg-200', 'bg-300', 'bg-400',
  'bg-500', 'bg-raised',
];
export const TEXT_KEYS = ['text-000', 'text-100', 'text-200', 'text-300'];

/* ── the themes ───────────────────────────────────────────────────── */

/*
 * groundHue  — the hue the neutral ramp is re-tinted onto. Deliberately not
 *              the accent hue: claude's own ground sits at 48deg while its
 *              accent is at 15deg, i.e. the ground lives in the accent's
 *              family rather than matching it. Every theme follows that.
 * satMul     — multiplies the reference saturation. Dark is lifted well
 *              above claude's 1.6%, which is the research's "avoid
 *              grey-on-grey fatigue" note; without it a re-hue at claude's
 *              saturation is invisible on a dark ground.
 * lightShift — moves the whole ramp. Only `neon` uses it, to reach the
 *              near-black ground the research calls for.
 * accent     — [dark, light], unchanged from the shipped presets.
 */
export const THEMES = {
  claude: {
    label: 'Claude',
    note: 'The default. Warm charcoal and ivory with the copper brand accent — identity values, unchanged.',
    ground: { dark: { hue: null, satMul: 1 }, light: { hue: null, satMul: 1 } },
    accent: ['#d97757', '#af593f'],
  },
  slate: {
    label: 'Slate',
    note: 'Cool zinc/slate neutrals — the dominant direction for technology products.',
    ground: { dark: { hue: 214, satMul: 5.6 }, light: { hue: 213, satMul: 0.9 } },
    accent: ['#8aa2c0', '#44618a'],
  },
  sage: {
    label: 'Sage',
    note: 'Olive and stone — the earth-tone direction, calm and low-fatigue.',
    ground: { dark: { hue: 126, satMul: 5.0 }, light: { hue: 122, satMul: 0.95 } },
    accent: ['#8fb27b', '#4d7a42'],
  },
  lavender: {
    label: 'Lavender',
    note: 'Digital lavender on a cool violet-grey ground.',
    ground: { dark: { hue: 262, satMul: 5.4 }, light: { hue: 258, satMul: 0.85 } },
    accent: ['#ab93e3', '#6d4fc4'],
  },
  lime: {
    label: 'Lime',
    note: 'Fintech lime against cool whites — bright and dashboard-first, the ground stays crisp.',
    ground: { dark: { hue: 76, satMul: 5.2 }, light: { hue: 72, satMul: 1.4 } },
    accent: ['#b3cf5a', '#5f7d1f'],
  },
  amber: {
    label: 'Amber',
    note: 'Sandstone and warm sand — pushed distinctly warmer and drier than the default.',
    ground: { dark: { hue: 33, satMul: 6.5 }, light: { hue: 36, satMul: 2.0 } },
    accent: ['#d9a842', '#96690e'],
  },
  ocean: {
    label: 'Ocean',
    note: 'Cool marine blue on a crisp blue-grey ground.',
    ground: { dark: { hue: 200, satMul: 5.6 }, light: { hue: 202, satMul: 0.9 } },
    accent: ['#55a7d8', '#1f6fa8'],
  },
  rose: {
    label: 'Rose',
    note: 'Muted rose against a warm blush-grey ground.',
    ground: { dark: { hue: 345, satMul: 5.2 }, light: { hue: 345, satMul: 0.9 } },
    accent: ['#d98298', '#b04a66'],
  },
  neon: {
    label: 'Neon',
    note: 'Restrained neon on near-black — micro-glow accents against a deep ground.',
    ground: {
      dark: { hue: 172, satMul: 5.0, lightShift: -0.045 },
      light: { hue: 172, satMul: 0.8 },
    },
    accent: ['#3ee6c8', '#0f8f7a'],
  },
};

export const DEFAULT_THEME = 'claude';



/* ── generation ───────────────────────────────────────────────────── */

function rgbaString(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/*
 * Builds one theme in one mode. Returns the token map plus the contrast
 * report, so the generator and the CI checker share one source of truth
 * about what passed and by how much.
 */
export function buildMode(themeName, mode) {
  const theme = THEMES[themeName];
  if (!theme) throw new Error(`unknown theme: ${themeName}`);
  const ref = REFERENCE[mode];
  const tint = theme.ground[mode];
  const dark = mode === 'dark';
  const tokens = {};

  /* The default theme is pinned, not derived — see CLAUDE_IDENTITY. The
     generated tokens below still run for the handful this table predates
     (terminal, framebuffer, shadow colours), then the table is reapplied
     last so nothing can overwrite it. */
  const pinned = themeName === DEFAULT_THEME ? CLAUDE_IDENTITY[mode] : null;

  /* Two different tint strengths, and the difference matters.

     Grounds start almost neutral (claude's --bg-000 is 1.6% saturation), so
     they need a multiplier to pick up any of the theme's hue at all.

     Text does not: claude's --text-000 is already 19% saturation, and
     putting the ground's multiplier through it drives every theme's body
     text to fully saturated pastel -- #c9e0ff for slate, #cbfdd0 for sage.
     Those still clear AA against a dark ground, so contrast checks do not
     catch it; it simply looks wrong. Text is re-hued at the reference
     saturation instead, which is what makes it read as an off-white that
     belongs to the theme rather than as coloured text.

     The same applies to anything whose reference value already carries
     saturation: the inverted-button pair, the light-mode shadow tint. */
  const subtle = { hue: tint.hue, satMul: 1, lightShift: tint.lightShift };
  for (const key of SURFACE_KEYS) tokens[key] = retint(ref[key], tint);
  for (const key of TEXT_KEYS) tokens[key] = retint(ref[key], subtle);
  for (const key of ['btn-inverted-bg', 'btn-inverted-bg-hover', 'btn-inverted-text']) {
    tokens[key] = retint(ref[key], subtle);
  }

  /* Text is tuned against the worst backdrop it actually lands on, which is
     not the same set for every role:
       - text-primary is body copy and can appear on anything, including the
         deepest elevation and a hover fill, so it clears AA on all of them.
       - text-secondary/text-muted are metadata on content surfaces. They are
         held to AA across the page ground, the chrome bands and the card
         surfaces, but not against surface-3 or surface-hover — a hover fill
         and the deepest elevation are transient chrome, not body backdrops.
         This is the scope #46 settled; holding them to surface-hover would
         move claude's shipped values, which are identity. */
  const all = SURFACE_KEYS.map((k) => tokens[k]);
  const content = ['bg-000', 'bg-sidebar', 'bg-toolbar', 'bg-100', 'bg-200', 'bg-300', 'bg-raised']
    .map((k) => tokens[k]);
  const worstOf = (color, set) =>
    set.reduce((worst, bg) => (contrast(color, bg) < contrast(color, worst) ? bg : worst), set[0]);

  const away = dark ? 1 : -1;
  tokens['text-000'] = tune(tokens['text-000'], worstOf(tokens['text-000'], all), { direction: away });
  tokens['text-100'] = tune(tokens['text-100'], worstOf(tokens['text-100'], content), { direction: away });
  tokens['text-200'] = tune(tokens['text-200'], worstOf(tokens['text-200'], content), { direction: away });
  /* text-disabled is intentionally below AA — it signals unavailability and
     WCAG exempts disabled controls. Left as tinted, not tuned. */
  const worstFor = (color) => worstOf(color, all);

  const accent = retint(theme.accent[dark ? 0 : 1], { hue: null });
  const s1 = tokens['bg-200'];
  const softAlpha = dark ? 0.16 : 0.13;

  tokens.accent = accent;
  tokens['accent-hover'] = shiftLightness(accent, dark ? 0.05 : -0.04);
  tokens['accent-pressed'] = shiftLightness(accent, dark ? -0.05 : -0.08);
  tokens['accent-soft'] = rgbaString(accent, softAlpha);
  tokens['accent-text-on-soft'] = tune(accent, composite(accent, softAlpha, s1), { direction: away });
  tokens['text-link'] = tune(accent, s1, { direction: away });
  tokens['text-link-hover'] = shiftLightness(tokens['text-link'], dark ? 0.06 : -0.06);

  /* Ink on a solid accent fill: near-black or near-white, whichever wins. */
  const darkInk = tune('#1c1613', accent, { direction: -1 });
  const lightInk = tune('#ffffff', accent, { direction: 1 });
  tokens['text-on-accent'] = contrast(darkInk, accent) >= contrast(lightInk, accent) ? darkInk : lightInk;

  /* Focus ring must clear the 3:1 non-text floor (WCAG 1.4.11) against the
     surfaces it is drawn over — the subject of the original #45. */
  tokens['border-focus'] = tune(accent, worstFor(accent), { target: AIM_NONTEXT, direction: away });
  tokens['switch-on'] = tokens['text-link'];

  const borderBase = retint(ref['border-rgb'], subtle);
  tokens['border-100'] = rgbaString(borderBase, ref['border-subtle-a']);
  tokens['border-200'] = rgbaString(borderBase, ref['border-strong-a']);
  tokens['overlay-bg'] = rgbaString(retint(ref['overlay-rgb'], subtle), ref['overlay-a']);

  /* Shadow colours, not whole shadow values: light-dark() takes <color>
     only, so the geometry is shared in the base block and just the tint and
     alpha vary by mode. The one deliberate deviation from the previous
     hand-written values is the dialog's ambient blur, normalised from
     70px (light) / 80px (dark) to a single 80px — imperceptible at that
     radius, and it buys one block per theme instead of three. */
  const sh = retint(ref['shadow-rgb'], subtle);
  const a = (alpha) => rgbaString(sh, alpha);
  tokens['shadow-raised-near'] = a(dark ? 0.18 : 0.11);
  tokens['shadow-raised-far'] = a(dark ? 0.24 : 0.16);
  tokens['shadow-dialog-near'] = a(dark ? 0.3 : 0.12);
  tokens['shadow-dialog-far'] = a(dark ? 0.52 : 0.19);
  /* Tighter elevation for pills, tabs and hover affordances — the six rules
     that used to hardcode rgba(0, 0, 0, ...) and so never followed the
     theme at all. */
  tokens['shadow-inset-color'] = a(dark ? 0.18 : 0.12);
  tokens['shadow-pill-color'] = a(dark ? 0.24 : 0.16);

  /* Semantic status ramp, theme-scoped.
     Each status keeps its meaning-bearing hue family -- green reads as
     success, red as danger -- but is nudged a little toward the theme's own
     ground hue so it sits in the theme rather than on top of it, then tuned
     against that theme's surfaces. The hue pull is deliberately small: a
     security console's severity colours have to stay learnable across
     themes, so this harmonises them, it does not reassign them. */
  const STATUS = {
    success: { light: '#3f8764', dark: '#79c99e' },
    info: { light: '#487eaa', dark: '#78a9d4' },
    warning: { light: '#9b6b25', dark: '#deb36a' },
    danger: { light: '#b34f4c', dark: '#dc7774' },
    critical: { light: '#c53030', dark: '#ff5c5c' },
  };
  const STATUS_SOFT_ALPHA = { success: dark ? 0.20 : 0.18, info: dark ? 0.20 : 0.18, warning: dark ? 0.21 : 0.19, danger: dark ? 0.21 : 0.20, critical: dark ? 0.16 : 0.13 };
  const groundHue = tint.hue;
  for (const [name, pair] of Object.entries(STATUS)) {
    const base = pair[mode];
    const [bh, bs, bl] = rgbToHsl(...hexToRgb(base));
    /* Pull HUE_PULL of the way toward the theme's ground, along the short
       way round the wheel so red never travels through green to get there. */
    let hue = bh;
    if (groundHue !== null && groundHue !== undefined) {
      let delta = ((groundHue - bh + 540) % 360) - 180;
      hue = (bh + delta * HUE_PULL + 360) % 360;
    }
    const tinted = rgbToHex(...hslToRgb(hue, bs, bl));
    tokens[name] = tinted;
    const alpha = STATUS_SOFT_ALPHA[name];
    tokens[`${name}-soft`] = rgbaString(tinted, alpha);
    tokens[`${name}-text-on-soft`] = tune(tinted, composite(tinted, alpha, tokens['bg-200']), { direction: away });
    /* Badges are a solid fill under fixed near-black ink; the fill has to
       clear AA against that ink, which is what the original --*-badge-fill
       family was added for. Not applicable to critical, which has no badge. */
    if (name !== 'critical') {
      tokens[`${name}-badge-fill`] = tune(tinted, BADGE_INK, { direction: 1 });
    }
  }

  /* Terminal and framebuffer surfaces. A terminal stays a terminal, but it
     should sit in its theme's family rather than being a fixed #16181d
     slab dropped onto a paper-white page. */
  tokens['terminal-bg'] = dark ? shiftLightness(tokens['bg-100'], -0.045) : shiftLightness(tokens['bg-400'], -0.62);
  tokens['terminal-fg'] = tune(dark ? tokens['text-000'] : '#e6e6e6', tokens['terminal-bg'], { direction: 1 });
  tokens['framebuffer-bg'] = shiftLightness(tokens['terminal-bg'], -0.03);
  tokens['diagram-plate'] = '#ffffff';

  if (pinned) Object.assign(tokens, pinned);

  return { tokens, mode, theme: themeName };
}

export function buildTheme(name) {
  return { light: buildMode(name, 'light'), dark: buildMode(name, 'dark') };
}

/* ── validation ───────────────────────────────────────────────────── */

/*
 * The pair table. This is the artifact worth having: the knowledge that
 * used to live in prose comments next to hand-measured ratios, in a form
 * something can enforce.
 */
export function auditMode(built) {
  const t = built.tokens;
  const surfaces = SURFACE_KEYS.map((k) => [k, t[k]]);
  const rows = [];
  const push = (label, fg, bg, target) =>
    rows.push({ label, ratio: contrast(fg, bg), target, pass: contrast(fg, bg) >= target });

  const CONTENT = new Set(['bg-000', 'bg-sidebar', 'bg-toolbar', 'bg-100', 'bg-200', 'bg-300', 'bg-raised']);
  for (const [name, bg] of surfaces) {
    push(`text-primary vs ${name}`, t['text-000'], bg, 4.5);
    if (CONTENT.has(name)) {
      push(`text-secondary vs ${name}`, t['text-100'], bg, 4.5);
      push(`text-muted vs ${name}`, t['text-200'], bg, 4.5);
    }
  }
  /* Read the alpha off the token rather than assuming the preset value —
     the default theme ships 0.14/0.12 where the generated themes use
     0.16/0.13, and measuring at the wrong alpha reports a colour that is
     never painted. */
  const softAlpha = parseColor(t['accent-soft'])[3];
  const softBg = composite(t.accent, softAlpha, t['bg-200']);
  push('accent-text-on-soft vs accent-soft over surface-1', t['accent-text-on-soft'], softBg, 4.5);
  push('text-link vs surface-1', t['text-link'], t['bg-200'], 4.5);
  push('text-on-accent vs accent', t['text-on-accent'], t.accent, 4.5);
  /* WCAG 1.4.11: non-text contrast floor is 3:1, not 4.5. */
  push('border-focus vs surface-1', t['border-focus'], t['bg-200'], 3);
  push('border-focus vs app-bg', t['border-focus'], t['bg-000'], 3);
  push('terminal-fg vs terminal-bg', t['terminal-fg'], t['terminal-bg'], 4.5);

  /* The status ramp is theme-scoped now, so each theme's own statuses are
     measured against its own surfaces rather than assumed shared. */
  for (const name of ['success', 'info', 'warning', 'danger', 'critical']) {
    const alpha = parseColor(t[`${name}-soft`])[3];
    push(`${name}-text-on-soft vs ${name}-soft over surface-1`,
      t[`${name}-text-on-soft`], composite(t[name], alpha, t['bg-200']), 4.5);
    if (t[`${name}-badge-fill`]) {
      push(`${name}-badge-fill vs badge ink`, BADGE_INK, t[`${name}-badge-fill`], 4.5);
    }
  }
  return rows;
}

export function auditAll() {
  const report = [];
  for (const name of Object.keys(THEMES)) {
    for (const mode of ['light', 'dark']) {
      for (const row of auditMode(buildMode(name, mode))) {
        report.push({ theme: name, mode, ...row });
      }
    }
  }
  return report;
}

/* Fails loudly if the default theme's shipped values ever drift. */
export function assertIdentity() {
  const drift = [];
  for (const mode of ['light', 'dark']) {
    const built = buildMode(DEFAULT_THEME, mode).tokens;
    for (const [key, want] of Object.entries(CLAUDE_IDENTITY[mode])) {
      if (built[key] !== want) drift.push(`${mode}/--${key}: expected ${want}, got ${built[key]}`);
    }
  }
  return drift;
}

/*
 * Documented, deliberate exceptions.
 *
 * Not a way to silence the checker — each entry names a pair that fails and
 * says why it is still shipping. An entry is debt with an owner, and the
 * checker prints them on every run so they stay visible.
 */
export const KNOWN_EXCEPTIONS = [
  /* Empty, and worth keeping that way. The one entry this list used to hold
     -- claude's light link blue at 3.95:1 -- is fixed rather than excused:
     links now derive from the accent and are AA-tuned like every other
     theme's (#103). */
];

export function isKnownException(row) {
  return KNOWN_EXCEPTIONS.some(
    (e) => e.theme === row.theme && e.mode === row.mode && e.label === row.label,
  );
}
