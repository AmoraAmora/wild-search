import { CrashPage } from '@/pages/crash';
import { HomePage } from '@/pages/home';
import { ErrorBoundary } from '@/shared/ui';

import { reportError } from './lib/report-error';
import { AppProviders } from './providers';

const reportRenderError = (error: unknown) => reportError(error, 'render');

export function App() {
  return (
    <AppProviders>
      {/* Inside the providers, so the fallback still gets the MUI theme. */}
      <ErrorBoundary fallback={<CrashPage />} onError={reportRenderError}>
        <HomePage />
      </ErrorBoundary>
    </AppProviders>
  );
}
