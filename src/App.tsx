import { AppRoutes } from './app/AppRoutes';
import { MessagingProvider } from './components/messaging/MessagingProvider';

export function App() {
  return (
    <MessagingProvider>
      <AppRoutes />
    </MessagingProvider>
  );
}
