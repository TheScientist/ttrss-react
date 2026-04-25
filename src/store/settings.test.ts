import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSettings, saveSettings } from './settings';

const LOCAL_KEY = 'ttrss-react-settings';

describe('store/settings', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no settings stored', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null as any);
    expect(getSettings()).toBeNull();
    expect(getSpy).toHaveBeenCalledWith(LOCAL_KEY);
  });

  it('handles malformed JSON gracefully and returns null', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{not json}');
    // spy on console.error to avoid noisy output
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(getSettings()).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('parses and returns stored settings', () => {
    const val = { apiUrl: 'https://x/api/', username: 'u', password: 'p', language: 'en', darkMode: true };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(JSON.stringify(val));
    expect(getSettings()).toEqual(val);
  });

  it('saves settings to localStorage', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    const val = { apiUrl: 'https://x/api/', username: 'u', password: 'p', language: 'de', darkMode: false };
    saveSettings(val as any);
    expect(setSpy).toHaveBeenCalledWith(LOCAL_KEY, JSON.stringify(val));
  });
});
