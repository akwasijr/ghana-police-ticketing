import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-status-error" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-text-secondary mb-6 max-w-md">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {this.state.error && (
            <details className="mb-6 text-left w-full max-w-md">
              <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                View error details
              </summary>
              <pre className="mt-2 p-4 bg-surface-elevated rounded-md text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary wrapper
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  isHandheld?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  isHandheld = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[300px] p-6 text-center ${
      isHandheld ? 'bg-background-dark text-white' : ''
    }`}
  >
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        isHandheld ? 'bg-status-error/20' : 'bg-status-error/10'
      }`}
    >
      <AlertTriangle className={`w-7 h-7 ${isHandheld ? 'text-[#E57373]' : 'text-status-error'}`} />
    </div>
    <h3
      className={`text-lg font-semibold mb-2 ${
        isHandheld ? 'text-white' : 'text-text-primary'
      }`}
    >
      Error
    </h3>
    <p
      className={`text-sm mb-4 ${isHandheld ? 'text-white/70' : 'text-text-secondary'}`}
    >
      {error.message || 'Something went wrong'}
    </p>
    <Button
      onClick={resetError}
      variant={isHandheld ? 'action' : 'primary'}
      size={isHandheld ? 'handheld' : 'md'}
      leftIcon={<RefreshCw className="w-4 h-4" />}
    >
      Retry
    </Button>
  </div>
);

export default ErrorBoundary;
