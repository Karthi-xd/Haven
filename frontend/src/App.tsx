import { useRef, useState, useEffect } from "react";
import "./components/Haven.css";
import PetalCanvas from "./components/PetalCanvas";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import Space from "./components/Space";
import LoadingScene from "./components/LoadingScene";
import { usePetalTransition } from "./hooks/usePetalTransition";
import { fetchMe } from "./api/auth";
import { supabase, isSupabaseConfigured, withTimeout } from "./lib/supabaseClient";

type View = "landing" | "login" | "register" | "space";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [leaving, setLeaving] = useState(false);
  const [loginActive, setLoginActive] = useState(false);
  const [loginPlay, setLoginPlay] = useState(false);
  const [registerActive, setRegisterActive] = useState(false);
  const [registerPlay, setRegisterPlay] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [connError, setConnError] = useState("");
  const [startupAttempt, setStartupAttempt] = useState(0);

  const enterBtnRef = useRef<HTMLButtonElement>(null);
  const transitionCanvasRef = useRef<HTMLCanvasElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const { launch } = usePetalTransition(transitionCanvasRef, transitionOverlayRef);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // On mount, check if a Supabase session already exists.
  // Every branch of this chain ends in setCheckingAuth(false) — including the
  // failure paths — so a bad connection shows an error instead of hanging on
  // the loading screen forever.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnError("Haven isn't configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.");
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;
    setConnError("");
    setCheckingAuth(true);

    withTimeout(supabase.auth.getSession(), 8000)
      .then(({ data }) => {
        if (cancelled) return;
        if (data.session) {
          return fetchMe()
            .then((profile) => {
              if (cancelled) return;
              // Registration always creates the Space profile in the same step,
              // so a session always means "go straight to the Space."
              setView(profile ? "space" : "landing");
            })
            .catch(() => {
              if (!cancelled) setView("landing");
            });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setConnError(
          "Can't reach the server right now. Check your connection and try again."
        );
        // eslint-disable-next-line no-console
        console.error("Startup session check failed:", err);
      })
      .finally(() => {
        if (!cancelled) setCheckingAuth(false);
      });

    return () => {
      cancelled = true;
    };
  }, [startupAttempt]);

  function goToLogin(btn: HTMLButtonElement) {
    if (reduceMotion) {
      setView("login");
      setLoginActive(true);
      requestAnimationFrame(() => setLoginPlay(true));
      return;
    }
    setLeaving(true);
    launch(
      btn,
      () => {
        setView("login");
        setLeaving(false);
        setLoginActive(true);
        setLoginPlay(false);
        requestAnimationFrame(() => setLoginPlay(true));
      },
      () => { /* done */ }
    );
  }

  function goToLanding() {
    setLoginActive(false);
    setLoginPlay(false);
    setRegisterActive(false);
    setRegisterPlay(false);
    setLeaving(false);
    setTimeout(() => setView("landing"), 30);
  }

  function goToRegister() {
    setLoginActive(false);
    setLoginPlay(false);
    setRegisterActive(true);
    setRegisterPlay(false);
    setView("register");
    requestAnimationFrame(() => setRegisterPlay(true));
  }

  function goToLoginFromRegister() {
    setRegisterActive(false);
    setRegisterPlay(false);
    setLoginActive(true);
    setLoginPlay(false);
    setView("login");
    requestAnimationFrame(() => setLoginPlay(true));
  }

  // Registration lands the user straight in their Space — no setup step in between.
  function handleRegisterSuccess() {
    setRegisterActive(false);
    setRegisterPlay(false);
    setView("space");
  }

  function handleLoginSuccess() {
    setLoginActive(false);
    setLoginPlay(false);
    setView("space");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setView("landing");
    setLoginActive(false);
    setLoginPlay(false);
    setRegisterActive(false);
    setRegisterPlay(false);
  }

  function retryConnection() {
    setStartupAttempt((n) => n + 1);
  }

  const showPetals = view === "landing" || view === "login" || view === "register";

  if (checkingAuth) {
    return (
      <div className="app">
        <PetalCanvas />
        <div className="glow" />
        <LoadingScene />
      </div>
    );
  }

  return (
    <div className="app">
      {showPetals && <PetalCanvas />}
      <div className="glow" />

      {connError && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#3a1d1d",
            color: "#ffd9d9",
            padding: "10px 16px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            textAlign: "center",
          }}
        >
          <span>{connError}</span>
          <button
            type="button"
            onClick={retryConnection}
            style={{
              background: "#ffd9d9",
              color: "#3a1d1d",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="petal-transition" ref={transitionOverlayRef} aria-hidden="true">
        <canvas id="petal-transition-canvas" ref={transitionCanvasRef} />
      </div>

      {view === "landing" && (
        <Landing
          ref={enterBtnRef}
          leaving={leaving}
          active={view === "landing"}
          onEnter={goToLogin}
        />
      )}

      {view === "login" && (
        <Login
          active={loginActive}
          play={loginPlay}
          onBack={goToLanding}
          onSuccess={handleLoginSuccess}
          onSignUp={goToRegister}
        />
      )}

      {view === "register" && (
        <Register
          active={registerActive}
          play={registerPlay}
          onBack={goToLanding}
          onSuccess={handleRegisterSuccess}
          onLogin={goToLoginFromRegister}
        />
      )}

      {view === "space" && <Space onLogout={handleLogout} />}
    </div>
  );
}
