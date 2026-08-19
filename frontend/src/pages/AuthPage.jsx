import { AuthActionPanel } from "../components/auth/AuthActionPanel";
import { APP_NAME, AppLogo } from "../components/AppLogo";
import { useRgb } from "../context/RgbContext";

function AuthPage() {
  const { rgbStyle, showGlow } = useRgb();

  return (
    <div className="app-shell">
      <div className="app-shell-backdrop" aria-hidden />
      <div
        className="relative flex w-full flex-1 flex-col overflow-hidden rounded-3xl p-[3px] rgb-border-glow shadow-2xl"
        style={rgbStyle}
      >
        {showGlow && <div className="rgb-backdrop-glow" />}

        <div className="app-inner-panel flex-col">
          <div className="auth-grid-overlay" aria-hidden />

          <main className="relative z-1 flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10 sm:px-6 md:py-12">
            <div className="flex w-full max-w-100 flex-col items-center">
              <div className="auth-logo-orb">
                <div className="auth-logo-orb__inner">
                  <AppLogo size={52} className="rounded-full" alt="" />
                </div>
              </div>

              <h1 className="auth-brand-title mt-5 text-center">{APP_NAME}</h1>

              <p className="auth-protocol-label mt-2.5">Neural Protocol v4.2</p>

              <div className="mt-8 w-full">
                <AuthActionPanel />
              </div>

              <p className="auth-footer-note">256-bit AES-GCM · TLS 1.3 Strict</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
export default AuthPage;