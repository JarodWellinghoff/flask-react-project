// src/components/ErrorBoundary/ErrorBoundary.jsx
import React from "react";
import "./ErrorBoundary.css";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary'>
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className='error-boundary__reload'>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
