export const HOTKEYS = {
  // Navigation
  NEXT_ARTICLE_1: 'j',
  NEXT_ARTICLE_2: 'n',
  PREV_ARTICLE_1: 'k',
  PREV_ARTICLE_2: 'p',
  
  // Article actions (when selected)
  TOGGLE_STARRED: 's',
  TOGGLE_UNREAD: 'u',
  OPEN_IN_NEW_TAB: 'o',
  MARK_ALL_AS_READ: 'm',
  CLOSE_ARTICLE: 'c',
  
  // Help
  SHOW_HELP: '?',
};

// Mapping of hotkey keys to i18n translation keys
export const HOTKEY_I18N_KEYS: Record<string, string> = {
  [HOTKEYS.NEXT_ARTICLE_1]: 'hotkey_next_article',
  [HOTKEYS.NEXT_ARTICLE_2]: 'hotkey_next_article',
  [HOTKEYS.PREV_ARTICLE_1]: 'hotkey_prev_article',
  [HOTKEYS.PREV_ARTICLE_2]: 'hotkey_prev_article',
  [HOTKEYS.TOGGLE_STARRED]: 'hotkey_toggle_starred',
  [HOTKEYS.TOGGLE_UNREAD]: 'hotkey_toggle_unread',
  [HOTKEYS.OPEN_IN_NEW_TAB]: 'hotkey_open_in_new_tab',
  [HOTKEYS.MARK_ALL_AS_READ]: 'hotkey_mark_all_as_read',
  [HOTKEYS.CLOSE_ARTICLE]: 'hotkey_close_article',
  [HOTKEYS.SHOW_HELP]: 'hotkey_show_help',
};

export const HOTKEY_GROUPS = {
  navigation: {
    titleKey: 'hotkey_reference_navigation',
    keys: [
      { key: HOTKEYS.NEXT_ARTICLE_1 },
      { key: HOTKEYS.NEXT_ARTICLE_2 },
      { key: HOTKEYS.PREV_ARTICLE_1 },
      { key: HOTKEYS.PREV_ARTICLE_2 },
    ],
  },
  actions: {
    titleKey: 'hotkey_reference_actions',
    keys: [
      { key: HOTKEYS.TOGGLE_STARRED },
      { key: HOTKEYS.TOGGLE_UNREAD },
      { key: HOTKEYS.OPEN_IN_NEW_TAB },
      { key: HOTKEYS.MARK_ALL_AS_READ },
      { key: HOTKEYS.CLOSE_ARTICLE },
    ],
  },
  help: {
    titleKey: 'hotkey_reference_help',
    keys: [
      { key: HOTKEYS.SHOW_HELP },
    ],
  },
};
