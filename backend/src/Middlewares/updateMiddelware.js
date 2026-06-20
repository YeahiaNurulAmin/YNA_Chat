import multer from "multer";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/rtf",
]);

function isAllowedFileType(mimetype) {
  return (
    mimetype.startsWith("image/") ||
    mimetype.startsWith("video/") ||
    mimetype.startsWith("audio/") ||
    ALLOWED_DOCUMENT_TYPES.has(mimetype)
  );
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!isAllowedFileType(file.mimetype)) {
      cb(
        new Error(
          "Only image, video, audio (including voice notes), and document uploads are allowed"
        )
      );
      return;
    }

    cb(null, true);
  },
});

export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Max size is 25MB per file." });
    }

    return res.status(400).json({ message: err.message });
  }

  if (err?.message?.includes("uploads are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  next(err);
}
