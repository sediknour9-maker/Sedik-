import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import type { RamadanOverride } from '../models/user';
import type { SupportedLanguage } from '../i18n';

interface AppSettings {
  language: SupportedLanguage;
  ramadanOverride: RamadanOverride;
}

interface SettingsContextValue extends AppSettings {
  isLoading: boolean;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  setRamadanOverride: (override: RamadanOverride) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = { language: 'en', ramadanOverride: 'auto' };

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readStorage<AppSettings>(STORAGE_KEYS.settings).then((stored) => {
      const resolved = stored ?? { ...DEFAULT_SETTINGS, language: i18n.language as SupportedLanguage };
      setSettings(resolved);
      i18n.changeLanguage(resolved.language);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = async (next: AppSettings) => {
    setSettings(next);
    await writeStorage(STORAGE_KEYS.settings, next);
  };

  const setLanguage = async (language: SupportedLanguage) => {
    await i18n.changeLanguage(language);
    await persist({ ...settings, language });
  };

  const setRamadanOverride = async (ramadanOverride: RamadanOverride) => {
    await persist({ ...settings, ramadanOverride });
  };

  const value = useMemo(
    () => ({ ...settings, isLoading, setLanguage, setRamadanOverride }),
    [settings, isLoading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
