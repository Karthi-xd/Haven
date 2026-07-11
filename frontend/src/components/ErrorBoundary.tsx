import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches JavaScript errors anywhere in the child component tree and shows a
 * friendly fallback screen instead of a blank white page. Does NOT catch
 * errors inside async code (network calls, promises) — those are handled by
 * try/catch in the API layer and shown as inline banners/messages instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Haven crashed:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FFF6F7 55%, #FFEFF1 100%)",
            color: "var(--ink, #1C1310)",
            fontFamily: "'Zen Kaku Gothic New', sans-serif",
            padding: 24,
            textAlign: "center",
          }}
        >
          <span aria-hidden="true" style={{ color: "var(--cherry, #C4183C)" }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c2.5 2 4 4.7 4 7.2a4 4 0 0 1-8 0C8 7.7 9.5 5 12 3Z" />
              <path d="M12 14v7M8.5 18.5c1-1 2-1.4 3.5-1.4s2.5.4 3.5 1.4" />
            </svg>
          </span>
          <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Shippori Mincho', serif", color: "var(--cherry-deep, #7A0F26)" }}>
            Something went wrong
          </h1>
          <p style={{ margin: 0, opacity: 0.75, maxWidth: 420, fontSize: 14.5 }}>
            Haven ran into an unexpected error. This is usually temporary —
            reloading the page fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              background: "var(--cherry, #C4183C)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "11px 26px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(196,24,60,0.25)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(196,24,60,0.32)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(196,24,60,0.25)"; }}
          >
            Reload Haven
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}