export interface Settings {
  apiUrl: string;
  username: string;
  password: string;
  serverUrl?: string; // Optional: The base URL of the TT-RSS instance, e.g., https://your.ttrss.host
  darkMode?: boolean;
  counterUpdateInterval?: number; // in seconds
  language?: string;
}
