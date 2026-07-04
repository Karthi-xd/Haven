import { useRef, useState, useEffect } from "react";
import "./components/Haven.css";
import PetalCanvas from "./components/PetalCanvas";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import CompleteProfile from "./components/CompleteProfile";
import DashboardPlaceholder from "./components/DashboardPlaceholder";
import LoadingScene from "./components/LoadingScene";
import { usePetalTransition } from "./hooks/usePetalTransition";
import { fetchMe } from "./api/client";

type View = "landing" | "login" | "register" | "complete-profile" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [leaving, setLeaving] = useState(false);
  const [loginActive, setLoginActive] = useState(false);
  const [loginPlay, setLoginPlay] = useState(false);
  const [registerActive, setRegisterActive] = useState(false);
  const [registerPlay, setRegisterPlay] = useState(false);
  const [profileActive, setProfileActive] = useState(false);
  const [profilePlay, setProfilePlay] = useState(false);
  const [initialUsername, setInitialUsername] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const enterBtnRef = useRef<HTMLButtonElement>(null);
  const transitionCanvasRef = useRef<HTMLCanvasElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const { launch } = usePetalTransition(transitionCanvasRef, transitionOverlayRef);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // On mount, check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchMe()
        .then((data) => {
          // If user has display_name and username set, go to dashboard
          if (data.display_name && data.username) {
            setView("dashboard");
          } else {
            // Needs to complete profile
            setInitialUsername(data.username || "");
            setView("complete-profile");
            setProfileActive(true);
            requestAnimationFrame(() => setProfilePlay(true));
          }
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, []);

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
    setProfileActive(false);
    setProfilePlay(false);
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

  function handleRegisterSuccess() {
    // After signup, go to complete profile
    setRegisterActive(false);
    setRegisterPlay(false);
    setInitialUsername("");
    setProfileActive(true);
    setProfilePlay(false);
    setView("complete-profile");
    requestAnimationFrame(() => setProfilePlay(true));
  }

  async function handleLoginSuccess() {
    // After login, only send the user to "complete profile" if they
    // genuinely haven't finished it yet — otherwise straight to the dashboard.
    setLoginActive(false);
    setLoginPlay(false);
    try {
      const data = await fetchMe();
      if (data.display_name && data.username) {
        setView("dashboard");
      } else {
        setInitialUsername(data.username || "");
        setProfileActive(true);
        setProfilePlay(false);
        setView("complete-profile");
        requestAnimationFrame(() => setProfilePlay(true));
      }
    } catch {
      // If this fails for some reason, fall back to complete-profile rather than a dead end.
      setInitialUsername("");
      setProfileActive(true);
      setProfilePlay(false);
      setView("complete-profile");
      requestAnimationFrame(() => setProfilePlay(true));
    }
  }

  function handleProfileComplete() {
    setProfileActive(false);
    setProfilePlay(false);
    setView("dashboard");
  }

  function handleLogout() {
    setView("landing");
    setLoginActive(false);
    setLoginPlay(false);
    setRegisterActive(false);
    setRegisterPlay(false);
    setProfileActive(false);
    setProfilePlay(false);
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

      {view === "complete-profile" && (
        <CompleteProfile
          active={profileActive}
          play={profilePlay}
          initialUsername={initialUsername}
          onSuccess={handleProfileComplete}
        />
      )}

      {view === "dashboard" && (
        <DashboardPlaceholder onLogout={handleLogout} />
      )}
    </div>
  );
}