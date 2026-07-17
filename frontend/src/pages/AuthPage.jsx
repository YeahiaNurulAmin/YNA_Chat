import { AuthActionPanel } from "../components/auth/AuthActionPanel";
import AuthHeader from "../components/auth/AuthHeader";
import { AuthHeroPanel } from "../components/auth/AuthHeroPanel";
import { useRgb } from "../context/RgbContext";

function AuthPage() {
  const { rgbStyle, showGlow } = useRgb();

  return (
    <div className="app-shell">
      <div className="app-shell-backdrop" aria-hidden />
      <div className="relative flex w-full flex-1 flex-col rounded-3xl p-[3px] overflow-hidden rgb-border-glow shadow-2xl" style={rgbStyle}>
        {showGlow && <div className="rgb-backdrop-glow" />}
        <div className="app-inner-panel flex-col">
          <AuthHeader />

          <main className="relative flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
            <AuthHeroPanel />
            <AuthActionPanel />
          </main>
        </div>
      </div>
    </div>
  );
}
export default AuthPage;
