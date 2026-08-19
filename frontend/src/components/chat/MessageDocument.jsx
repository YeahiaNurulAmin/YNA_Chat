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
      className="msg-doc"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[rgba(34,211,238,0.1)] sm:size-11">
        <Icon
          className={`size-5 sm:size-[1.35rem] ${isOwnMessage ? "text-[var(--cl-glow-magenta)]" : "text-[var(--cl-glow-cyan)]"}`}
          strokeWidth={1.75}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-[var(--cl-on-surface)]">{displayName}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--cl-outline)]">
          {typeLabel}
        </p>
      </div>

      <span className={`shrink-0 text-xs font-medium ${isOwnMessage ? "text-[var(--cl-glow-magenta)]" : "text-[var(--cl-glow-cyan)]"}`}>
        Open
      </span>
    </a>
  );
}
