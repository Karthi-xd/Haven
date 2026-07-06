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
            background: "#0f1710",
            color: "#e9f2e6",
            fontFamily: "system-ui, sans-serif",
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.8, maxWidth: 420 }}>
            Haven ran into an unexpected error. This is usually temporary —
            reloading the page fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              background: "#4c9a5f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Reload Haven
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
