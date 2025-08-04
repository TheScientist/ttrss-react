import type { Settings } from '../types/settings';

const SETTINGS_KEY = 'ttrss-react-settings';

export const getSettings = (): Settings | null => {
  const settingsJson = localStorage.getItem(SETTINGS_KEY);
  if (!settingsJson) {
    return null;
  }
  try {
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error parsing settings from localStorage', error);
    return null;
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
