# armory

<div align=center>
<img height=100 src="./favicon.png">

A minimalist workspace for managing multiple [Excalidraw](https://excalidraw.com) diagrams.
</div>

Try it out on [yagodorea.github.io/armory](https://yagodorea.github.io/armory). Deployed with GH pages.

## Features

- **Multiple diagrams** in one workspace, listed in the sidebar. The diagram **name is the primary identifier**.
- **Autosave** — every change is persisted to `localStorage` (debounced, ~300ms).
- **Create / rename / delete / reorder** — double-click a diagram in the sidebar to rename it; hover to reveal the delete button. Drag to reorder.
- **Export** — pick any subset of diagrams and download them as a single JSON pack (`armory-diagram-pack`).
- **Import** — load a pack (or a plain `.excalidraw` scene file). When an incoming diagram's name already exists, you're asked per diagram: **Replace**, **Keep both** (imported copy is renamed `Name (2)`, `Name (3)`, …), or **Cancel** (skip it).
- **Dark mode** — the toggle in the sidebar switches the whole workspace (sidebar, dialogs, and every diagram's canvas).
- **Collapsible sidebar** — the «/» toggle collapses the sidebar to a thin rail, giving the canvas the full window. Collapsed is the default; the choice is remembered per workspace. Creating a diagram re-expands it, since the new diagram opens in rename mode.
- **Multi-tab safe** — tabs sync through `storage` events: creating, renaming, deleting, importing, or toggling the theme or sidebar in one tab is reflected live in the others. Scene content is last-write-wins, so avoid actively drawing on the _same_ diagram in two tabs at once.

## Running

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve that build locally
```

## Pack format

```json
{
  "type": "armory-diagram-pack",
  "version": 1,
  "exportedAt": "2026-07-20T00:00:00.000Z",
  "diagrams": [
    { "name": "Architecture", "elements": [], "appState": {}, "files": {} }
  ]
}
```

`elements`, `appState`, and `files` are standard Excalidraw scene data.

## Implementation notes

- Uses the official `@excalidraw/excalidraw` React component instead of an iframe (need an API to read/write scene data, which the workspace needs for save/load/export).
- Storage layout: `armory.index` holds the ordered name list. Each scene lives at `armory.diagram.<name>` so large scenes don't rewrite the whole workspace on save. Workspace preferences are their own keys: `armory.theme`, `armory.sidebar`, `armory.library`.
- Layout: `App.jsx` owns workspace state (the diagram list, the active diagram, autosave, import/export flows) and nothing else; each piece of UI is a component under `src/components/` with its stylesheet beside it. `global.css` holds only the reset, the theme tokens, and the shared button styles.
