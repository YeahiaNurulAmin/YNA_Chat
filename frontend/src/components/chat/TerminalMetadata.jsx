/**
 * Technical status labels shown above the message composer (Cyber-Luxe Glass).
 * Used on ChatPage main panel footer.
 */

export function TerminalMetadata() {
  return (
    <div className="cyber-terminal-meta">
      <div className="cyber-terminal-meta__left">
        <span className="cyber-meta-tag cyber-meta-tag--cyan">UPLINK_STABLE</span>
        <span className="cyber-meta-tag cyber-meta-tag--violet">ENCRYPTION: AES-256</span>
      </div>
      <span className="cyber-meta-version hidden sm:inline">YNA_SYSTEM_ROOT_4.2.0</span>
    </div>
  );
}
