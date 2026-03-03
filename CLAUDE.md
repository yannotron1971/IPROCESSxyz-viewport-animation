# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build step. Serve static files with any HTTP server on port 8080 (matching the VS Code launch config):

```bash
npx serve . -p 8080
# or
python -m http.server 8080
```

Open `index.html` via the server (not `file://`) since some pens use ES modules.

## Architecture

Two IIFEs loaded in order in `index.html`:

1. **`iprocess-intro.js`** — Intro overlay animation
   - Checks `sessionStorage` for `iprocess_intro_shown` to skip on repeat visits (controlled by `CONFIG.oncePerSession`)
   - Dynamically loads GSAP from CDN, then runs a scramble text reveal on `.intro-logo` chars (`ABCDEFGHIJKLMNOPQRSTUVWXYZ"@$%^&*` for the white chars, `abcdefghijklmnopqrstvwxyz` for the gold `xyz` suffix), animates a loader bar, then slides the `#intro-overlay` upward and dispatches `window.introComplete`
   - Requires DOM: `.intro-overlay`, `.intro-logo`, `.intro-loader`, `.intro-loader-bar`
   - Safety timeout forces removal after `CONFIG.safetyTimeout` ms if animation stalls

2. **`IPROCESSxyz-viewport-animation.js`** — Background particle animation
   - Contains a `pens` array registry. Each pen is `{ name, deps[], mount(stageEl) }`
   - On load, picks a random pen, loads its `deps` sequentially from CDN, then calls `mount(#intro-stage)`
   - Each pen's `mount()` injects its own HTML (canvas/custom element) into `#intro-stage` and initializes its animation logic self-contained

## Common Debugging Overrides

**Force a specific pen** (uncomment in `IPROCESSxyz-viewport-animation.js:1690`):
```js
return pens.find(p => p.name === "bubbles");
```

**Disable once-per-session** to see the intro on every reload (`iprocess-intro.js:32`):
```js
oncePerSession: false
```

## Adding a New Pen

Add an entry to the `pens` array in `IPROCESSxyz-viewport-animation.js`:
```js
{
  name: "myPen",
  deps: ["https://cdn.example.com/lib.js"],
  mount(stage) {
    // inject HTML into stage, initialize animation
  }
}
```

The pen is automatically eligible for random selection. `stage` is `#intro-stage` (fixed-positioned, full-viewport, `z-index: 0`, `opacity: 0.4`).
