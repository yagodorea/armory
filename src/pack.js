// Shareable JSON pack format for exporting/importing groups of diagrams.

export const PACK_TYPE = "armory-diagram-pack";
export const PACK_VERSION = 1;

export function buildPack(diagrams) {
  return {
    type: PACK_TYPE,
    version: PACK_VERSION,
    exportedAt: new Date().toISOString(),
    diagrams: diagrams.map(({ name, data }) => ({
      name,
      elements: data?.elements ?? [],
      appState: data?.appState ?? {},
      files: data?.files ?? {},
    })),
  };
}

// Accepts either an armory pack or a plain .excalidraw scene file.
// Returns [{ name, data }] or throws with a user-readable message.
export function parseImport(json, fallbackName) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (parsed && parsed.type === PACK_TYPE && Array.isArray(parsed.diagrams)) {
    return parsed.diagrams
      .filter((d) => d && typeof d.name === "string" && d.name.trim() !== "")
      .map((d) => ({
        name: d.name.trim(),
        data: {
          elements: Array.isArray(d.elements) ? d.elements : [],
          appState: d.appState ?? {},
          files: d.files ?? {},
        },
      }));
  }

  if (
    parsed &&
    parsed.type === "excalidraw" &&
    Array.isArray(parsed.elements)
  ) {
    return [
      {
        name: fallbackName,
        data: {
          elements: parsed.elements,
          appState: parsed.appState ?? {},
          files: parsed.files ?? {},
        },
      },
    ];
  }

  throw new Error(
    "Unrecognized file format. Expected an Armory diagram pack or an .excalidraw scene."
  );
}

export function downloadJson(object, filename) {
  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
