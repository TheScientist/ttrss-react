import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSettings, saveSettings } from './settings';

const LOCAL_KEY = 'ttrss-react-settings';

describe('store/settings', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns null when no settings stored', async () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null as any);
    const res = await getSettings();
    expect(res).toBeNull();
    expect(getSpy).toHaveBeenCalledWith(LOCAL_KEY);
  });

  it('handles malformed JSON gracefully and returns null', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{not json}');
    // spy on console.error to avoid noisy output
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await getSettings();
    expect(res).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('parses and returns stored settings', async () => {
    const val = { apiUrl: 'https://x/api/', username: 'u', password: 'p', language: 'en', darkMode: true };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(JSON.stringify(val));
    // ensure credentials API does not override — provide a safe mock if absent
    (navigator as any).credentials = { get: vi.fn().mockResolvedValue(null) };
    const res = await getSettings();
    expect(res).toEqual(val);
  });

  it('saves settings to localStorage', async () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    const val = { apiUrl: 'https://x/api/', username: 'u', password: 'p', language: 'de', darkMode: false } as any;
    // ensure credentials API not available so localStorage will contain password
    (navigator as any).credentials = undefined;
    await saveSettings(val);
    expect(setSpy).toHaveBeenCalledWith(LOCAL_KEY, JSON.stringify(val));
  });
});
