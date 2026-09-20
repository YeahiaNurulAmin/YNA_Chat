/**
 * Custom Clerk auth card: sign-in / sign-up toggle, email + password,
 * direct OAuth SSO, and email-verification step. No Clerk UI surfaces.
 */

import { useClerk, useSignIn, useSignUp } from "@clerk/react";
import { useState } from "react";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { AuthCardShell } from "./AuthCardShell";

const AFTER_AUTH = "/";
const SSO_CALLBACK_URL = "/sso-callback";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4.5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4.5 text-[var(--cl-on-surface)]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5 text-[var(--cl-on-surface)]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

const socialProviders = [
  { label: "Google", strategy: "oauth_google", Icon: GoogleIcon },
  { label: "GitHub", strategy: "oauth_github", Icon: GitHubIcon },
  { label: "X", strategy: "oauth_twitter", Icon: XIcon },
];

function extractError(error) {
  return (
    error?.errors?.[0]?.longMessage ??
    error?.errors?.[0]?.message ??
    error?.message ??
    null
  );
}

const fieldClassName = "auth-field-input w-full text-sm";

export function AuthActionPanel() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [verifyStep, setVerifyStep] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === "signin";

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setVerifyStep(null);
    setCode("");
  };

  const handleSso = async (strategy) => {
    if (!signIn || !signUp) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const target = isSignIn ? signIn : signUp;
      const result = await target.sso({
        strategy,
        redirectUrl: window.location.origin + AFTER_AUTH,
        redirectCallbackUrl: window.location.origin + SSO_CALLBACK_URL,
      });
      if (result.error) setError(extractError(result.error));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!signIn || !signUp) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignIn) {
        const result = await signIn.create({ identifier: email, password });
        if (result.error) {
          setError(extractError(result.error));
          return;
        }
        if (signIn.status === "complete") {
          await signIn.finalize();
        } else if (signIn.status === "needs_first_factor") {
          const factorResult = await signIn.password({ password });
          if (factorResult.error) {
            setError(extractError(factorResult.error));
            return;
          }
          if (signIn.status === "complete") {
            await signIn.finalize();
          } else {
            clerk.redirectToSignIn({ redirectUrl: AFTER_AUTH });
          }
        } else {
          clerk.redirectToSignIn({ redirectUrl: AFTER_AUTH });
        }
      } else {
        const result = await signUp.create({ emailAddress: email, password });
        if (result.error) {
          setError(extractError(result.error));
          if (signUp.isTransferable) switchMode("signin");
          return;
        }
        if (signUp.status === "complete") {
          await signUp.finalize();
        } else if (signUp.status === "needs_email_address_verification") {
          const sendResult = await signUp.verifications.sendEmailCode();
          if (sendResult.error) {
            setError(extractError(sendResult.error));
            return;
          }
          setVerifyStep("email_code");
        } else {
          clerk.redirectToSignUp({ redirectUrl: AFTER_AUTH });
        }
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    if (!signUp) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setError(extractError(result.error));
        return;
      }
      if (signUp.status === "complete") {
        await signUp.finalize();
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToForm = () => {
    setVerifyStep(null);
    setCode("");
    setError(null);
  };

  return (
    <AuthCardShell>
      <h2 className="auth-card-heading">
        {isSignIn ? "Welcome Back" : "Create Account"}
      </h2>
      <p className="auth-card-subheading">
        {isSignIn ? "Enter your credentials to access the grid" : "Join the secure YNA network"}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {socialProviders.map(({ label, strategy, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={`Continue with ${label}`}
            onClick={() => handleSso(strategy)}
            disabled={isSubmitting}
            className="auth-social-btn"
          >
            <Icon className="size-4.5" aria-hidden />
          </button>
        ))}
      </div>

      <div className="auth-divider-row relative flex items-center gap-3">
        <span className="auth-divider-line h-px flex-1" />
        <span className="auth-divider-text">Or continue with</span>
        <span className="auth-divider-line h-px flex-1" />
      </div>

      {verifyStep === "email_code" ? (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="auth-verify-code" className="auth-field-label">
              Verification code
            </label>
            <div className="relative">
              <KeyRoundIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--cl-outline)]"
                aria-hidden
              />
              <input
                id="auth-verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>

          {error && <p className="auth-form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              "Verify Email"
            )}
          </button>

          <button
            type="button"
            onClick={backToForm}
            className="auth-toggle-link mx-auto block"
          >
            Use a different email
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="auth-field-label">
              Email Address
            </label>
            <div className="relative">
              <MailIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--cl-outline)]"
                aria-hidden
              />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="neon@yna.io"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${fieldClassName} auth-field-has-leading-icon`}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="auth-field-label">
              Password
            </label>
            <div className="relative">
              <KeyRoundIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--cl-outline)]"
                aria-hidden
              />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${fieldClassName} auth-field-has-leading-icon auth-field-has-trailing-icon`}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--cl-outline)] transition-colors hover:text-[var(--cl-glow-cyan)]"
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" aria-hidden />
                ) : (
                  <EyeIcon className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {error && <p className="auth-form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? (
              <Loader2Icon className="mx-auto size-4 animate-spin" aria-hidden />
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isSignIn ? "Sign In" : "Create Account"}
                <ArrowRightIcon className="size-4" aria-hidden />
              </span>
            )}
          </button>
        </form>
      )}

      {/* Clerk injects its bot-protection widget into this element when a sign-up
          (email/password or OAuth) needs a captcha token; it stays empty otherwise. */}
      <div id="clerk-captcha" />

      <div className="auth-clerk-footer">
        <div className="auth-toggle-row">
          <span>{isSignIn ? "New here?" : "Already have an account?"}</span>
          <button
            type="button"
            onClick={() => switchMode(isSignIn ? "signup" : "signin")}
            className="auth-toggle-link"
          >
            {isSignIn ? "Create Account" : "Sign In"}
          </button>
        </div>
      </div>
    </AuthCardShell>
  );
}