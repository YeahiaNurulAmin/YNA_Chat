/**
 * Auth card wrapper with animated gradient border and glass inner panel.
 * Used by AuthActionPanel.
 */

const cardClassName = "auth-card-outer";

export function AuthCardShell({ children }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-100">
      <div className={cardClassName}>
        <div className="auth-card-inner">{children}</div>
      </div>
    </div>
  );
}