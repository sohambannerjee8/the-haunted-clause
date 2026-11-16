// Helpers for reading the JSON event that Kiro hooks pass on STDIN.
// Kiro documents that command hooks receive session context and, for file
// events, the file path as JSON on STDIN. Field names are read defensively so
// the scripts keep working if the exact key differs between Kiro versions.
import { isAbsolute, relative, sep } from "node:path";

const PATH_KEYS = new Set(["file_path", "filePath", "path", "file", "filename", "uri"]);
const LIST_KEYS = new Set(["files", "file_paths", "filePaths", "paths"]);

/** Collect file paths from a hook event object (any nesting depth). */
export function extractPaths(event) {
  const found = [];
  const visit = (value, depth) => {
    if (depth > 4 || value === null || typeof value !== "object") return;
    for (const [key, v] of Object.entries(value)) {
      if (PATH_KEYS.has(key) && typeof v === "string" && v.length > 0) {
        found.push(v.startsWith("file://") ? decodeURIComponent(v.slice(7)) : v);
      } else if (LIST_KEYS.has(key) && Array.isArray(v)) {
        for (const item of v) if (typeof item === "string" && item) found.push(item);
      } else if (typeof v === "object") {
        visit(v, depth + 1);
      }
    }
  };
  visit(event, 0);
  return [...new Set(found)];
}

/** Make a path relative to the repository root, using forward slashes. */
export function toRepoRelative(p, root) {
  const rel = isAbsolute(p) ? relative(root, p) : p;
  return rel.split(sep).join("/");
}

/** Read all of STDIN as JSON. Returns null when there is no input or it is not JSON. */
export async function readStdinJson(timeoutMs = 2000) {
  if (process.stdin.isTTY) return null;
  const text = await new Promise((resolve) => {
    let data = "";
    const timer = setTimeout(() => resolve(data), timeoutMs);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      resolve(data);
    });
  });
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
