import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Log error to external service in production
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error tracking service
            // logErrorToService(error, errorInfo);
        }
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const isDevelopment = process.env.NODE_ENV === 'development';

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    padding: '20px'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        width: '100%',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface)',
                        padding: '40px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                    }}>
                        {/* Error Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px'
                        }}>
                            😕
                        </div>

                        {/* Error Message */}
                        <h2 style={{
                            margin: '0 0 10px 0',
                            fontSize: '24px',
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                        }}>
                            Oops! Something went wrong
                        </h2>

                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            marginBottom: '30px'
                        }}>
                            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                        </p>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
                            <button
                                onClick={this.handleRefresh}
                                className="primary"
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--bg-hover)';
                                    e.target.style.borderColor = 'var(--text-secondary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Error Details (Development Only) */}
                        {isDevelopment && this.state.error && (
                            <details style={{
                                marginTop: '30px',
                                textAlign: 'left',
                                backgroundColor: 'var(--bg-input)',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '10px'
                                }}>
                                    Error Details (Development Mode)
                                </summary>
                                <pre style={{
                                    fontSize: '12px',
                                    color: 'var(--danger)',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    margin: 0
                                }}>
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Help Text */}
                        <p style={{
                            marginTop: '20px',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic'
                        }}>
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
