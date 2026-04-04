import { Redirect } from 'expo-router';
import React from 'react';
import { useSessionStore } from '../src/store/useSessionStore';

export default function Index() {
  const { isAuthenticated, isBootstrapped } = useSessionStore();

  if (!isBootstrapped) return null; // Wait for AuthProvider

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
