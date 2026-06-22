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
