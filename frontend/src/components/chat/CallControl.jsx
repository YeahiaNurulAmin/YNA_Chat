export function CallControl({ icon, label, tone = "neutral", active = false, onPress }) {
  return (
    <div className="cyber-call-control-wrap">
      <button
        type="button"
        className={`cyber-call-control cyber-call-control--${tone}${active ? " cyber-call-control--active" : ""}`}
        aria-label={label}
        aria-pressed={active}
        onClick={onPress}
      >
        {icon}
      </button>
      <span className="cyber-call-control-label">{label}</span>
    </div>
  );
}