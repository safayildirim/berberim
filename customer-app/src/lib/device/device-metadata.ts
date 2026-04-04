import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  INSTALLATION_ID: 'device_installation_id',
  PUSH_TOKEN: 'device_push_token',
  PUSH_DEVICE_ID: 'registered_push_device_id',
} as const;

type DevicePlatform = 'ios' | 'android' | 'web';
type DeviceProvider = 'expo' | 'fcm';

export interface PushDeviceRegistrationPayload {
  platform: DevicePlatform;
  provider: DeviceProvider;
  device_token: string;
  app_version?: string;
  locale?: string;
  timezone?: string;
  installation_id: string;
}

function normalizePlatform(): DevicePlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Platform.OS;
  }
  return 'web';
}

function appVersion(): string {
  return (Constants.expoConfig?.version || 'dev').trim();
}

function osVersion(): string {
  return String(Platform.Version ?? '').trim();
}

function deviceModel(): string {
  const name = (Constants as any).deviceName;
  if (!name) return '';
  return String(name).trim();
}

function locale(): string {
  return Localization.getLocales()[0]?.languageTag?.trim() ?? '';
}

function timezone(): string {
  return Localization.getCalendars()[0]?.timeZone?.trim() ?? '';
}

function generateInstallationId(): string {
  const platform = normalizePlatform();
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  return `${platform}-${ts}-${rand}`;
}

async function installationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(STORAGE_KEYS.INSTALLATION_ID);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const next = generateInstallationId();
  await SecureStore.setItemAsync(STORAGE_KEYS.INSTALLATION_ID, next);
  return next;
}

export async function setDevicePushToken(token: string | null): Promise<void> {
  if (token && token.trim().length > 0) {
    await SecureStore.setItemAsync(STORAGE_KEYS.PUSH_TOKEN, token.trim());
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PUSH_TOKEN);
}

export async function setRegisteredPushDeviceId(
  deviceId: string | null,
): Promise<void> {
  if (deviceId && deviceId.trim().length > 0) {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.PUSH_DEVICE_ID,
      deviceId.trim(),
    );
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEYS.PUSH_DEVICE_ID);
}

export async function getRegisteredPushDeviceId(): Promise<string | null> {
  const deviceId = await SecureStore.getItemAsync(STORAGE_KEYS.PUSH_DEVICE_ID);
  if (!deviceId || deviceId.trim().length === 0) {
    return null;
  }
  return deviceId.trim();
}

export async function getPushDeviceRegistrationPayload(
  tokenOverride?: string,
): Promise<PushDeviceRegistrationPayload | null> {
  const rawToken =
    tokenOverride ??
    (await SecureStore.getItemAsync(STORAGE_KEYS.PUSH_TOKEN)) ??
    '';
  const deviceToken = rawToken.trim();
  if (!deviceToken) {
    return null;
  }

  const payload: PushDeviceRegistrationPayload = {
    platform: normalizePlatform(),
    provider: 'expo',
    device_token: deviceToken,
    installation_id: await installationId(),
  };

  const version = appVersion();
  if (version) {
    payload.app_version = version;
  }
  const localeValue = locale();
  if (localeValue) {
    payload.locale = localeValue;
  }
  const timezoneValue = timezone();
  if (timezoneValue) {
    payload.timezone = timezoneValue;
  }

  return payload;
}

export async function getDeviceHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'X-Device-Installation-Id': await installationId(),
    'X-Device-Provider': 'expo',
    'X-Device-Platform': normalizePlatform(),
    'X-App-Version': appVersion(),
    'X-Os-Version': osVersion(),
  };

  const localeValue = locale();
  if (localeValue) {
    headers['X-Device-Locale'] = localeValue;
  }
  const timezoneValue = timezone();
  if (timezoneValue) {
    headers['X-Device-Timezone'] = timezoneValue;
  }

  const model = deviceModel();
  if (model) {
    headers['X-Device-Model'] = model;
  }

  const pushToken = await SecureStore.getItemAsync(STORAGE_KEYS.PUSH_TOKEN);
  if (pushToken && pushToken.trim().length > 0) {
    headers['X-Device-Push-Token'] = pushToken.trim();
  }

  return headers;
}
