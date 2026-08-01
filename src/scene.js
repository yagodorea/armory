// Helpers for turning Excalidraw's live editor state into the scene shape
// that gets persisted (and back).

// appState fields that don't survive JSON round-trips or don't belong to a
// saved scene (collaborators is a Map; theme is workspace-wide, not
// per-diagram; the rest is transient UI state).
export function sanitizeAppState(appState) {
  if (!appState) return {};
  const {
    collaborators,
    theme,
    contextMenu,
    openMenu,
    openPopup,
    openSidebar,
    openDialog,
    cursorButton,
    ...rest
  } = appState;
  return rest;
}

export function sceneFromChange(elements, appState, files) {
  return {
    elements: elements.filter((el) => !el.isDeleted),
    appState: sanitizeAppState(appState),
    files: files ?? {},
  };
}
