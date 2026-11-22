import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: unknown, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/** React still requires a class component to catch render errors. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
