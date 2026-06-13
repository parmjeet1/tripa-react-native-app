// ─── Brand Colors ──────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#2596be',
  primaryDark: '#1a7a9e',
  primaryLight: '#4ab0d1',
  primaryUltraLight: '#e8f6fb',
  primaryMuted: '#b8dff0',

  // Status
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',

  // Neutrals
  white: '#ffffff',
  background: '#f0f8fc',
  surface: '#ffffff',
  border: '#d4eaf5',
  borderLight: '#e8f4fb',

  // Text
  textPrimary: '#0f2b3d',
  textSecondary: '#4a7a94',
  textMuted: '#8ab4c8',
  textOnPrimary: '#ffffff',

  // Card / Tab
  cardBg: '#ffffff',
  tabActive: '#2596be',
  tabInactive: '#8ab4c8',
  tabBg: '#ffffff',

  // Price badges
  fixedBadge: '#1a7a9e',
  negotiableBadge: '#e8f6fb',
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Border Radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#2596be',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#2596be',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#2596be',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

import { Platform, NativeModules } from 'react-native';
import * as Linking from 'expo-linking';

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_SERVER_BASE_URL
    ? process.env.EXPO_PUBLIC_BACKEND_SERVER_BASE_URL.trim().replace(/\s/g, '')
    : '';

  // localhost/127.0.0.1 on mobile devices will always fail (unreachable).
  // In those cases, we ignore it and use dynamic detection or emulator fallbacks.
  const isLocalhost = envUrl.includes('localhost') || envUrl.includes('127.0.0.1');
  const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';

  if (envUrl && !(isLocalhost && isMobile)) {
    console.log(`[Config] Resolved API_BASE_URL from env: "${envUrl}"`);
    return envUrl;
  }

  if (Platform.OS === 'web') {
    const webUrl = envUrl || 'http://localhost:2424';
    console.log(`[Config] Resolved API_BASE_URL for Web: "${webUrl}"`);
    return webUrl;
  }

  let detectedIp = '';

  // 1. Try resolving via NativeModules.SourceCode.scriptURL
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    try {
      const ipPort = scriptURL.split('://')[1].split('/')[0];
      detectedIp = ipPort.split(':')[0];
    } catch (e) {
      // Ignore and try next method
    }
  }

  // 2. Try resolving via expo-linking (highly reliable in Expo Go)
  if (!detectedIp || detectedIp === 'localhost' || detectedIp === '127.0.0.1') {
    try {
      const devUrl = Linking.createURL('/');
      if (devUrl && devUrl.includes('://')) {
        const ipPort = devUrl.split('://')[1].split('/')[0];
        detectedIp = ipPort.split(':')[0];
      }
    } catch (e) {
      // Ignore and try fallback
    }
  }

  // If we successfully found a non-localhost IP, use it!
  if (detectedIp && detectedIp !== 'localhost' && detectedIp !== '127.0.0.1') {
    const dynamicUrl = `http://${detectedIp}:2424`;
    console.log(`[Config] Resolved API_BASE_URL dynamically: "${dynamicUrl}" (Detected Host IP: ${detectedIp})`);
    return dynamicUrl;
  }

  // Fallback for Android Emulator
  if (Platform.OS === 'android') {
    const fallbackUrl = 'http://10.0.2.2:2424';
    console.log(`[Config] Resolved API_BASE_URL fallback: "${fallbackUrl}"`);
    return fallbackUrl;
  }

  const fallbackUrl = 'http://localhost:2424';
  console.log(`[Config] Resolved API_BASE_URL fallback: "${fallbackUrl}"`);
  return fallbackUrl;
};

export const API_BASE_URL = getApiUrl();
