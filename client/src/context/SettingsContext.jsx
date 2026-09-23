import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings } from '../api/settings';

const SettingsContext = createContext(null);

function resolveTheme(theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const refresh = useCallback(() => {
    return getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!settings) return;

    document.documentElement.setAttribute('data-theme', resolveTheme(settings.theme));

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => document.documentElement.setAttribute('data-theme', resolveTheme('system'));
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings]);

  return <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
