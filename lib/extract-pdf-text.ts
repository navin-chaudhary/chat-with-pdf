import path from "path";
import { pathToFileURL } from "url";

/**
 * Turbopack still traces static `import from "pdfjs-dist/..."` and bundles pdf.js,
 * which breaks worker resolution (`./pdf.worker.mjs` → `.next/server/chunks/`).
 * Loading pdf.mjs via runtime `file://` import forces Node to use the real package on disk.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsCached: any = null;

async function getPdfjsFromDisk() {
  if (pdfjsCached) return pdfjsCached;

  const pdfMain = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.mjs",
  );
  const workerFile = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );

  const pdfUrl = pathToFileURL(pdfMain).href;
  pdfjsCached = await import(/* webpackIgnore: true */ pdfUrl);
  pdfjsCached.GlobalWorkerOptions.workerSrc = pathToFileURL(workerFile).href;

  return pdfjsCached;
}

/** Build one page of plain text with spaces and line breaks from pdf.js items. */
function textFromPageItems(
  items: Array<{ str?: string; hasEOL?: boolean; transform?: number[] }>,
): string {
  let line = "";

  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const s = item.str;
    if (!s) continue;

    const needSpace =
      line.length > 0 &&
      !/\s$/.test(line) &&
      !/^[.,;:!?%)\]}'"›»]/.test(s) &&
      !/^[/\\-]/.test(s);

    if (needSpace) line += " ";
    line += s;

    if (item.hasEOL) {
      line += "\n";
    }
  }

  return line.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extract plain text from a PDF buffer (server-side Node only).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs = await getPdfjsFromDisk();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });
  const pdf = await loadingTask.promise;

  try {
    const parts: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = textFromPageItems(content.items);
      if (pageText) parts.push(pageText);
      page.cleanup();
    }
    return parts.join("\n\n").trim();
  } finally {
    await pdf.destroy();
  }
}
