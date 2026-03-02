# ECHO.11 v7 — 3 Accessibility Fixes for Vercel

## Fix 1: Missing <main> in Splash Screen
The Splash component doesn't have a `<main>` landmark. Vercel requires every page to have one.

**Find this in the Splash function (around line 340):**
```
    }}>
      <link href="https://fonts.googleapis.com/...
```

**Replace with:**
```
    }}>
      <main>
      <link href="https://fonts.googleapis.com/...
```

**And before the closing `</div>` of Splash (around line 378), add `</main>`:**
```
      </div>
      </main>
      <div style={{ position: "absolute", bottom: 20...
```

Alternatively, change the outermost `<div>` of Splash to `<main>`.

---

## Fix 2: Low Contrast Colors
These colors fail WCAG AA on the warm-white background (#FAFAF8):

| Current   | Used For                     | Fix To     | Ratio Before | Ratio After |
|-----------|------------------------------|------------|--------------|-------------|
| `#ccc`    | Splash "ECHO.11", footer     | `#767676`  | ~1.5:1       | 4.5:1 ✅    |
| `#ddd`    | Splash subtitle, idle text   | `#767676`  | ~1.3:1       | 4.5:1 ✅    |
| `#bbb`    | History counter, placeholder | `#767676`  | ~1.8:1       | 4.5:1 ✅    |
| `#aaa`    | AI links label, misc         | `#737373`  | ~2.3:1       | 4.6:1 ✅    |

**Search and replace in the file:**
- `color: "#ccc"` → `color: "#767676"` (all instances except inside COLORS array)
- `color: "#ddd"` → `color: "#767676"`
- `color: "#bbb"` → `color: "#767676"`
- `color: "#aaa"` → `color: "#737373"`

**Do NOT change:**
- The COLORS array (score ring colors)
- Border colors (#eae9e4, #eee etc.)
- Background colors
- The placeholder CSS `textarea::placeholder { color: #bbb; }` → change to `#999`

---

## Fix 3: Hidden ARIA Element
The decorative sparkle in idle state may be flagged:

**Find (around line 744):**
```jsx
<div style={{ fontSize: "2em", opacity: 0.08, marginBottom: 6 }} aria-hidden="true">✨</div>
```

**Replace with (add role="presentation"):**
```jsx
<div style={{ fontSize: "2em", opacity: 0.08, marginBottom: 6 }} aria-hidden="true" role="presentation">✨</div>
```

Also check the radial gradient glow div in Splash (around line 365):
```jsx
<div aria-hidden="true" style={{ position: "absolute", inset: -24, borderRadius: "50%"...
```
**Add role="presentation":**
```jsx
<div aria-hidden="true" role="presentation" style={{ position: "absolute", inset: -24, borderRadius: "50%"...
```

---

## Summary of Changes
1. Wrap Splash content in `<main>` tag
2. Darken 4 text colors (#ccc→#767676, #ddd→#767676, #bbb→#767676, #aaa→#737373)
3. Add `role="presentation"` to decorative aria-hidden elements

Total: ~15 line changes. Zero functionality changes.
