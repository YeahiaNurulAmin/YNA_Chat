import { FileIcon, FileSpreadsheetIcon, FileTextIcon, PresentationIcon } from "lucide-react";
import {
  getDisplayFileName,
  getFileExtension,
  getFileTypeLabel,
} from "../../lib/media";

function getDocumentIcon(extension) {
  if (extension === "pdf" || extension === "txt" || extension === "rtf") {
    return FileTextIcon;
  }

  if (extension === "xls" || extension === "xlsx") {
    return FileSpreadsheetIcon;
  }

  if (extension === "ppt" || extension === "pptx") {
    return PresentationIcon;
  }

  if (extension === "doc" || extension === "docx") {
    return FileTextIcon;
  }

  return FileIcon;
}

export function MessageDocument({ url, isOwnMessage = false }) {
  const extension = getFileExtension(url);
  const displayName = getDisplayFileName(url);
  const typeLabel = getFileTypeLabel(extension);
  const Icon = getDocumentIcon(extension);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mb-1.5 flex min-w-48 max-w-full items-center gap-3 rounded-xl border p-2.5 transition-opacity hover:opacity-90 sm:min-w-56 sm:p-3 ${
        isOwnMessage
          ? "border-accent-foreground/20 bg-accent-foreground/10 text-accent-foreground"
          : "border-border bg-background/60 text-foreground"
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11 ${
          isOwnMessage ? "bg-accent-foreground/15" : "bg-accent/10"
        }`}
      >
        <Icon
          className={`size-5 sm:size-[1.35rem] ${isOwnMessage ? "text-accent-foreground" : "text-accent"}`}
          strokeWidth={1.75}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
        <p
          className={`mt-0.5 truncate text-xs ${
            isOwnMessage ? "text-accent-foreground/70" : "text-muted"
          }`}
        >
          {typeLabel}
        </p>
      </div>

      <span
        className={`shrink-0 text-xs font-medium ${
          isOwnMessage ? "text-accent-foreground/80" : "text-accent"
        }`}
      >
        Open
      </span>
    </a>
  );
}
