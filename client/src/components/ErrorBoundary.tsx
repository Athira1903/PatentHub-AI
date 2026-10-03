import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-xl w-full shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {this.props.fallbackTitle || 'Something went wrong rendering this view'}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred in this component.'}
            </p>
            {this.state.errorInfo && (
              <details className="text-left text-[11px] bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-48 font-mono">
                <summary className="cursor-pointer text-slate-400 font-bold mb-1">View Error Stack</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre className="mt-2 text-rose-300">{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
