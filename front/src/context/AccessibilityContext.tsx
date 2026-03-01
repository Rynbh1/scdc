import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStorage } from '../utils/storage';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceAnimations: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setSettings: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
  textScale: number;
  colors: {
    background: string;
    card: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    buttonPrimaryBackground: string;
    buttonPrimaryText: string;
  };
  motionEnabled: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reduceAnimations: false,
};

const SETTINGS_STORAGE_KEY = 'accessibilitySettings';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await tokenStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Impossible de charger les paramètres d\'accessibilité', error);
      } finally {
        setReady(true);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!ready) return;
    tokenStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, ready]);

  const value = useMemo<AccessibilityContextType>(() => {
    const highContrast = settings.highContrast;

    return {
      settings,
      setSettings,
      textScale: settings.largeText ? 1.12 : 1,
      motionEnabled: !settings.reduceAnimations,
      colors: {
        background: highContrast ? '#000000' : '#000000',
        card: highContrast ? '#000000' : '#111111',
        border: highContrast ? '#FFFFFF' : '#222222',
        textPrimary: '#FFFFFF',
        textSecondary: highContrast ? '#F2F2F2' : '#BBBBBB',
        textMuted: highContrast ? '#D9D9D9' : '#888888',
        buttonPrimaryBackground: highContrast ? '#FFFFFF' : '#FFFFFF',
        buttonPrimaryText: highContrast ? '#000000' : '#000000',
      },
    };
  }, [settings]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility doit être utilisé dans un AccessibilityProvider');
  return context;
};
