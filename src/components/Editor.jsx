import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import * as storage from "../storage.js";
import { sanitizeAppState } from "../scene.js";
import "./Editor.css";

export default function Editor({
  name,
  sceneNonce,
  theme,
  apiRef,
  onChange,
  onCreate,
}) {
  const scene = name ? storage.loadDiagram(name) : null;

  return (
    <main className="editor">
      {name ? (
        <Excalidraw
          key={`${name}:${sceneNonce}`}
          excalidrawAPI={(api) => (apiRef.current = api)}
          theme={theme}
          initialData={{
            elements: scene?.elements ?? [],
            appState: sanitizeAppState(scene?.appState),
            files: scene?.files ?? {},
            libraryItems: storage.loadLibrary(),
          }}
          onChange={onChange}
          onLibraryChange={(items) => storage.saveLibrary(items)}
        />
      ) : (
        <div className="empty-state">
          <p>Create a diagram to get started.</p>
          <button className="btn primary" onClick={onCreate}>
            + New diagram
          </button>
        </div>
      )}
    </main>
  );
}
