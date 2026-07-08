import { useState, type FormEvent } from "react";
import { loginHaven as login, getErrorMessage } from "../api/auth";
import BrandScene from "./BrandScene";

interface LoginProps {
  active: boolean;
  play: boolean;
  onBack: () => void;
  onSuccess: () => void;
  onSignUp: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ active, play, onBack, onSuccess, onSignUp }: LoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const identifierFilled = identifier.trim().length > 0;
  const passwordFilled = password.trim().length > 0;
  const inBloom = identifierFilled && passwordFilled && !emailError;

  function validateEmail() {
    const val = identifier.trim();
    if (val.length === 0) {
      setEmailError("");
      return;
    }
    if (!EMAIL_RE.test(val)) {
      setEmailError("Please enter a valid email address (e.g., name@example.com).");
    } else {
      setEmailError("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) {
      setEmailError("Email address is required.");
      return;
    }
    if (!EMAIL_RE.test(val)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setError("");
    setSubmitting(true);
    try {
      await login(identifier, password);
      onSuccess();
    } catch (err: any) {
      setError(getErrorMessage(err, "Couldn't log you in — check your details and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`view view-login${active ? " active" : ""}${play ? " play" : ""}`}>
      <div className="login-scene">

        {/* LEFT — brand panel */}
        <div className="login-brand-panel fx fx-1">
          <BrandScene />
        </div>

        {/* RIGHT — form */}
        <div className="login-content">
          <button className="back-link fx fx-1" type="button" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>

          <div className="login-head fx fx-2">
            <svg className="accent-branch" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path className="ab-stem" d="M4 4 C 30 8, 52 20, 70 38 C 84 52, 92 62, 112 66" />
              <circle className="ab-bloom bright" cx="70" cy="38" r="7" />
              <circle className="ab-bloom light" cx="86" cy="30" r="5" />
              <circle className="ab-bloom" cx="52" cy="20" r="5.5" />
              <circle className="ab-bloom light" cx="112" cy="66" r="6" />
              <circle className="ab-bloom" cx="98" cy="58" r="5" />
            </svg>
            <h1>
              Welcome
              <br />
              back.
            </h1>
            <p className="sub">Your Space is waiting. Pick up where you left off.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={`vine-field-list${inBloom ? " in-bloom" : ""}`}>

              {/* Email / username field */}
              <div className={`vine-field fx fx-3${identifierFilled ? " filled" : ""}${emailError ? " field-error" : ""}`}>
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="identifier">Email address</label>
                <div className="input-wrap">
                  <input
                    id="identifier"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); if (emailError) setEmailError(""); }}
                    onBlur={validateEmail}
                  />
                  <div className="input-underline" />
                </div>
                {emailError && <p className="field-error-msg">{emailError}</p>}
              </div>

              {/* Password field */}
              <div className={`vine-field fx fx-4${passwordFilled ? " filled" : ""}`}>
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={`pw-toggle${showPassword ? " pw-toggle--open" : ""}`}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {/* petal shape that morphs into an open eye */}
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      {showPassword ? (
                        /* open — eye outline */
                        <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7A2.5 2.5 0 1 0 12 15a2.5 2.5 0 0 0 0-5z" />
                      ) : (
                        /* closed — petal shape */
                        <path d="M12 2c-1.8 0-2 1.6-2.6 2.3C6.5 6.7 4 9.6 4 13c0 3.6 2.8 6.6 6.4 7.8.5.2 1.1.2 1.6 0C15.6 19.6 18.4 16.6 18.4 13c0-3.4-2.5-6.3-5.4-8.7C12.4 3.6 12.2 2 12 2z" />
                      )}
                    </svg>
                  </button>
                  <div className="input-underline" />
                </div>
              </div>

            </div>

            <div className="row fx fx-5">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                />
                Stay signed in
              </label>
              <a href="#" className="link">
                Forgot password?
              </a>
            </div>

            {error && <p className="form-error fx fx-5">{error}</p>}

            <button type="submit" className="login-submit fx fx-6" disabled={submitting}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2c-1.8 0-2 1.6-2.6 2.3C6.5 6.7 4 9.6 4 13c0 3.6 2.8 6.6 6.4 7.8.5.2 1.1.2 1.6 0C15.6 19.6 18.4 16.6 18.4 13c0-3.4-2.5-6.3-5.4-8.7C12.4 3.6 12.2 2 12 2z" />
              </svg>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="divider fx fx-7">
            <span>or</span>
          </div>

          <button className="ghost-btn fx fx-8" type="button">
            Continue with Google
          </button>

          <p className="footer-text fx fx-9">
            New to Haven? <a href="#" className="link" onClick={(e) => { e.preventDefault(); onSignUp(); }}>Create a free account</a>
          </p>
        </div>
      </div>
    </section>
  );
}
