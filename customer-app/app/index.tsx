import { Redirect } from 'expo-router';
import { useSessionStore } from '@/src/lib/auth/session-store';

export default function Index() {
  const { isAuthenticated, tenants, activeTenantId } = useSessionStore();

  // Not logged in → auth flow
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Logged in but no tenants linked → link code screen
  if (tenants.length === 0) {
    return <Redirect href="/(tenant)/link-code" />;
  }

  // Logged in, has tenants, but no active tenant selected → tenant picker
  if (!activeTenantId) {
    return <Redirect href="/(tenant)/select-tenant" />;
  }

  // Fully set up → main app
  return <Redirect href="/(tabs)" />;
}
