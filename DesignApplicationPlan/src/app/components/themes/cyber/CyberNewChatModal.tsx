import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CyberModalShell } from "./CyberLocationModal";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { initials } from "../shared";
import type { User } from "../../../api/types";

const MONO = "'JetBrains Mono', monospace";
const CYAN = "#22d3ee";
const MAGENTA = "#f0f";
const VIOLET = "#8b5cf6";

// Lists every registered user so a new 1:1 conversation can be started.
export function CyberNewChatModal({
  users,
  isOnline,
  onSelect,
  onClose,
}: {
  users: User[];
  isOnline: (id: string) => boolean;
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <CyberModalShell title="NEW CONVERSATION" onClose={onClose}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-3" style={{ background: "rgba(139,92,246,0.08)", border: `1px solid rgba(139,92,246,0.35)` }}>
        <Search size={14} style={{ color: VIOLET }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search users..."
          className="bg-transparent outline-none w-full"
          style={{ fontFamily: MONO, fontSize: 12, color: "#cbd5e1" }}
        />
      </div>

      <div className="max-h-80 overflow-y-auto space-y-1.5 -mr-1 pr-1">
        {filtered.length === 0 && (
          <div className="py-8 text-center" style={{ fontFamily: MONO, fontSize: 12, color: "#64748b" }}>
            NO USERS FOUND
          </div>
        )}
        {filtered.map((u) => (
          <button
            key={u._id}
            onClick={() => onSelect(u._id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
            style={{ background: "rgba(34,211,238,0.04)", border: `1px solid ${CYAN}22` }}
          >
            <div className="relative shrink-0" style={{ width: 40, height: 40 }}>
              <div className="w-full h-full rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 12px rgba(34,211,238,0.5)` }}>
                <div className="w-full h-full rounded-full overflow-hidden grid place-items-center" style={{ background: "#06060f" }}>
                  {u.profilePicture ? (
                    <ImageWithFallback src={u.profilePicture} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: MONO, color: CYAN, fontSize: 13 }}>{initials(u.fullName)}</span>
                  )}
                </div>
              </div>
              {isOnline(u._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: "#4ade80", borderColor: "#06060f", boxShadow: "0 0 8px #4ade80" }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate" style={{ fontFamily: MONO, fontSize: 13, color: "#e2e8f0" }}>{u.fullName}</div>
              <div className="truncate" style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: isOnline(u._id) ? "#4ade80" : "#64748b" }}>
              {isOnline(u._id) ? "ONLINE" : "OFFLINE"}
            </span>
          </button>
        ))}
      </div>
    </CyberModalShell>
  );
}
