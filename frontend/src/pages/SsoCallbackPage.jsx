/**
 * Clerk SSO (OAuth) callback route.
 *
 * AuthActionPanel starts OAuth with the @clerk/react v6 signal API:
 *   signIn.sso({ strategy, redirectUrl, redirectCallbackUrl })
 *
 * Clerk only sends the browser to `redirectCallbackUrl` when the attempt needs one more
 * step (the account is new, so the sign-in is transferred to a sign-up, or the provider
 * account is already linked to another session). This route has to finish that in-flight
 * attempt before entering the app: finalize a completed sign-in/sign-up, transfer a
 * sign-up into a sign-in, or activate an already existing session.
 *
 * `HandleSSOCallback` is the SDK component that performs exactly those steps, and it also
 * renders the `#clerk-captcha` element Clerk needs for bot-protected sign-ups.
 *
 * The legacy `<AuthenticateWithRedirectCallback />` must NOT be used here: it only
 * completes the legacy `signIn.authenticateWithRedirect()` flow, so a `signIn.sso()`
 * attempt would never be finalized (provider login succeeds, app stays signed out).
 */

import { HandleSSOCallback } from "@clerk/react";
import { LoaderIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { APP_NAME, AppLogo } from "../components/AppLogo";

const AFTER_AUTH = "/";
const AUTH_ROUTE = "/auth";

function SsoCallbackPage() {
  const navigate = useNavigate();

  // `decorateUrl` can return an absolute URL (Safari ITP cookie refresh), which has to go
  // through the browser instead of the router.
  const goTo = (url) => {
    if (url.startsWith("http")) window.location.href = url;
    else navigate(url, { replace: true });
  };

  return (
    <div className="app-shell items-center justify-center">
      <div className="app-shell-backdrop" aria-hidden />

      <div className="relative flex flex-col items-center gap-4">
        <AppLogo size={44} className="rounded-xl ring-1 ring-white/10" />

        <div className="flex items-center gap-2 text-sm font-medium text-[var(--cl-on-surface-variant)]">
          <LoaderIcon className="size-4 animate-spin text-[var(--cl-glow-cyan)]" aria-hidden />
          <span className="brand-title">Completing {APP_NAME} sign in</span>
        </div>

        <HandleSSOCallback
          navigateToApp={({ decorateUrl }) => goTo(decorateUrl(AFTER_AUTH))}
          navigateToSignIn={() => navigate(AUTH_ROUTE, { replace: true })}
          navigateToSignUp={() => navigate(AUTH_ROUTE, { replace: true })}
        />
      </div>
    </div>
  );
}

export default SsoCallbackPage;
