import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { RegisterPushDeviceRequest } from '@/src/services/auth.service';
import {
  getPushDeviceRegistrationPayload,
  getRegisteredPushDeviceId,
  setDevicePushToken,
  setRegisteredPushDeviceId,
} from './device-metadata';

interface RegisterResponse {
  device_id: string;
}

interface RegistrationHandlers {
  registerPushDevice: (
    payload: RegisterPushDeviceRequest,
  ) => Promise<RegisterResponse>;
  deletePushDevice: (deviceId: string) => Promise<void>;
}

function resolveExpoProjectId(): string | null {
  const easProjectId = Constants.easConfig?.projectId;
  if (easProjectId && easProjectId.trim().length > 0) {
    return easProjectId.trim();
  }

  const extraProjectId = (
    Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  )?.eas?.projectId;
  if (extraProjectId && extraProjectId.trim().length > 0) {
    return extraProjectId.trim();
  }

  return null;
}

async function acquireExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F6BFF',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.warn('Push registration skipped: missing Expo project ID');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const value = token.data.trim();
  if (!value) {
    return null;
  }

  return value;
}

export async function syncPushDeviceRegistration(
  handlers: RegistrationHandlers,
): Promise<void> {
  try {
    const token = await acquireExpoPushToken();

    await setDevicePushToken(token);

    if (!token) {
      const existingDeviceId = await getRegisteredPushDeviceId();
      if (existingDeviceId) {
        try {
          await handlers.deletePushDevice(existingDeviceId);
        } catch (error) {
          console.warn('Push device cleanup failed', error);
        }
      }
      await setRegisteredPushDeviceId(null);
      return;
    }

    const payload = await getPushDeviceRegistrationPayload(token);
    if (!payload) {
      return;
    }

    const response = await handlers.registerPushDevice(payload);
    await setRegisteredPushDeviceId(response.device_id);
  } catch (error) {
    console.warn('Push registration failed', error);
  }
}

export async function unregisterPushDevice(
  handlers: Pick<RegistrationHandlers, 'deletePushDevice'>,
): Promise<void> {
  const deviceId = await getRegisteredPushDeviceId();
  if (deviceId) {
    try {
      await handlers.deletePushDevice(deviceId);
    } catch (error) {
      console.warn('Push device deletion failed', error);
    }
  }

  await setRegisteredPushDeviceId(null);
  await setDevicePushToken(null);
}
