import { AuthActionPanel } from "../components/auth/AuthActionPanel";
import AuthHeader from "../components/auth/AuthHeader";
import { AuthHeroPanel } from "../components/auth/AuthHeroPanel";
import { useRgb } from "../context/RgbContext";

function AuthPage() {
  const { rgbStyle, showGlow } = useRgb();

  return (
    <div className="box-border flex h-dvh flex-col p-0 bg-[#09090b] relative select-none overflow-hidden">
      <div className="relative flex w-full flex-1 flex-col rounded-3xl p-[3px] overflow-hidden rgb-border-glow shadow-2xl" style={rgbStyle}>
        {showGlow && <div className="rgb-backdrop-glow" />}
        <div className="relative flex w-full flex-1 flex-col overflow-hidden rounded-[21px] bg-background text-foreground z-10 border border-border/30">
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
