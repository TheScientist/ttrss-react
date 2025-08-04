import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {this.state.error?.toString()}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f5f5',
            p: 2,
            borderRadius: 1,
            overflowX: 'auto'
          }}>
            {this.state.errorInfo?.componentStack}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReload}
            sx={{ mt: 2 }}
          >
            Reload Application
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
