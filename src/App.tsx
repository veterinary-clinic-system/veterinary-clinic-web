import { AppRoutes } from './app/AppRoutes';
import { MessagingProvider } from './components/messaging/MessagingProvider';
import { PwaPrompts } from './components/pwa/PwaPrompts';

export function App() {
  return (
    <MessagingProvider>
      <AppRoutes />
      <PwaPrompts />
    </MessagingProvider>
  );
}
