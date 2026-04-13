import type { Settings } from '../types/settings';

const SETTINGS_KEY = 'ttrss-react-settings';

interface Credential {
  id?: string;
  password?: string;
  type?: string;
}

declare class PasswordCredential implements Credential {
  id: string;
  password: string;
  constructor(data: {
    id: string;
    password: string;
    name?: string;
  });
}

export const getSettings = async (): Promise<Settings | null> => {
  const settingsJson = localStorage.getItem(SETTINGS_KEY);
  let settings: Partial<Settings> | null = null;

  if (settingsJson) {
    try {
      settings = JSON.parse(settingsJson);
    } catch (error) {
      console.error('Error parsing settings from localStorage', error);
      return null;
    }
  }

  // Try to get credentials from Credential Manager API (preferred over localStorage)
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  ) {
    try {
      // Try Chromium-style request first (Edge/Chrome) to obtain password
      let credential: Credential | null = null;
      try {
        credential = await (navigator.credentials as any).get({ password: true, mediation: 'optional' });
      } catch (e) {
        // ignore and try fallback
      }

      if (!credential) {
        try {
          credential = await (navigator.credentials as any).get({ mediation: 'optional' });
        } catch (e) {
          // ignore
        }
      }

      if (credential && credential.id && credential.password) {
        console.debug('getSettings: Credentials retrieved from Credential Manager, using those');
        return {
          ...(settings as any),
          username: credential.id,
          password: credential.password,
        };
      }
    } catch (error) {
        console.debug('getSettings: Credential Manager unavailable');
    }
  }

  // Return localStorage settings (including password as fallback)
  if (settings && settings.apiUrl) {
    console.debug('getSettings: Returning localStorage settings');
    return settings as Settings;
  }
  
  console.debug('getSettings: No settings found');
  return null;
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  var storedAsCredential = false;
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    settings.username &&
    settings.password
  ) {
    storedAsCredential = await storeCredentials(settings.username, settings.password);
  }
  if(storedAsCredential) {
    settings = { ...settings, password: undefined };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } else {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  return Promise.resolve();
};

const storeCredentials = async (username: string, password: string): Promise<boolean> => {
  try {
    if (typeof PasswordCredential !== 'undefined') {
      const credential = new PasswordCredential({
        id: username,
        password: password,
        name: 'TT-RSS',
      }) as any;
      await navigator.credentials.store(credential);
      return true;
    }
    return false;
  } catch (error) {
      console.debug('Credential Manager unavailable');
      return false;
  }
};
