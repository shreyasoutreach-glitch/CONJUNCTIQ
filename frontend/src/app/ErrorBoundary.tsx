import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          alignItems: "center", 
          width: "100%", 
          height: "100%", 
          padding: "24px",
          background: "var(--surface-primary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--seam)"
        }}>
          <div style={{ color: "var(--critical)", fontSize: "24px", marginBottom: "16px" }}>⚠️ Module Failure</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px", textAlign: "center" }}>
            The {this.props.fallbackName || "component"} encountered a runtime error.
          </div>
          <pre style={{ 
            background: "var(--bg-base)", 
            padding: "16px", 
            borderRadius: "var(--radius-md)", 
            fontSize: "12px",
            color: "var(--text-silver)",
            maxWidth: "100%",
            overflow: "auto"
          }}>
            {this.state.error?.message || "Unknown error"}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
