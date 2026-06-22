// Keep in sync with backend/src/Middlewares/updateMiddelware.js and messageRoute.js
export const MAX_MEDIA_FILES = 10;
export const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file

export const MEDIA_ACCEPT = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/rtf",
].join(",");

/** Backend stores media as string arrays; ignore empty arrays and legacy single strings. */
export function normalizeMediaUrls(value) {
  if (!value) return [];

  const list = Array.isArray(value) ? value : [value];
  return list.filter((url) => typeof url === "string" && url.trim());
}

export function validateMediaFiles(files) {
  if (!files.length) {
    return { ok: false, message: "No files selected" };
  }

  if (files.length > MAX_MEDIA_FILES) {
    return {
      ok: false,
      message: `You can send up to ${MAX_MEDIA_FILES} files at once`,
    };
  }

  const oversized = files.find((file) => file.size > MAX_MEDIA_FILE_SIZE);
  if (oversized) {
    return {
      ok: false,
      message: `"${oversized.name}" is too large. Max size is 25MB per file.`,
    };
  }

  return { ok: true };
}

export function getFileNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "Document");
  } catch {
    return "Document";
  }
}

/** Strip ImageKit upload prefixes/hashes for a readable name in the UI. */
export function getDisplayFileName(url) {
  const raw = getFileNameFromUrl(url);
  const withoutPrefix = raw.replace(/^chat-\d+-/i, "");
  const lastDot = withoutPrefix.lastIndexOf(".");

  if (lastDot === -1) {
    return withoutPrefix.replace(/_[A-Za-z0-9]+$/, "") || "Document";
  }

  const extension = withoutPrefix.slice(lastDot);
  const baseName = withoutPrefix.slice(0, lastDot).replace(/_[A-Za-z0-9]+$/, "");
  return `${baseName || "Document"}${extension}`;
}

export function getFileExtension(url) {
  const name = getFileNameFromUrl(url);
  const match = name.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

export function getFileTypeLabel(extension) {
  const labels = {
    pdf: "PDF Document",
    doc: "Word Document",
    docx: "Word Document",
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
    ppt: "PowerPoint",
    pptx: "PowerPoint",
    txt: "Plain Text",
    rtf: "Rich Text",
  };

  return labels[extension] || "Document";
}
