import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { refreshOutline, alertCircleOutline } from 'ionicons/icons';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center">
            <IonIcon icon={alertCircleOutline} className="text-4xl text-[var(--ion-color-danger)]" />
          </div>
          <h2 className="m-0 text-lg font-bold text-[var(--ion-text-color)]">Something went wrong</h2>
          <p className="m-0 text-sm text-[var(--ion-text-color-secondary)] max-w-sm">
            An unexpected error occurred while loading this page. Please try again.
          </p>
          <IonButton shape="round" onClick={this.handleReload}>
            <IonIcon icon={refreshOutline} slot="start" />
            Reload Page
          </IonButton>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
