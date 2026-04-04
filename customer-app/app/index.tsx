import { Redirect } from 'expo-router';
import { useSessionStore } from '@/src/lib/auth/session-store';

export default function Index() {
  const { isAuthenticated } = useSessionStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
