// i18n.js - Internationalization support for Bookmark Organizer
// Supports runtime language switching across popup and options pages

const I18n = {
  currentLocale: 'en',
  messages: {},
  fallbackLocale: 'en',

  async init() {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    const savedLocale = settings.language;

    if (savedLocale) {
      this.currentLocale = savedLocale;
    } else {
      const browserLang = navigator.language || 'en';
      const supported = ['en', 'zh_CN', 'es', 'ja', 'de'];
      if (supported.includes(browserLang)) {
        this.currentLocale = browserLang;
      } else if (browserLang.startsWith('zh')) {
        this.currentLocale = 'zh_CN';
      } else {
        this.currentLocale = 'en';
      }
    }

    await this.loadMessages(this.currentLocale);
  },

  async loadMessages(locale) {
    try {
      const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
      const response = await fetch(url);
      this.messages = await response.json();
    } catch (e) {
      console.error('Failed to load messages for', locale, e);
      if (locale !== this.fallbackLocale) {
        await this.loadMessages(this.fallbackLocale);
      }
    }
  },

  t(key, substitutions) {
    const entry = this.messages[key];
    if (!entry || !entry.message) {
      console.warn('Missing i18n key:', key);
      return key;
    }
    let text = entry.message;
    if (substitutions && Array.isArray(substitutions)) {
      substitutions.forEach((sub, i) => {
        text = text.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    return text;
  },

  async setLocale(locale) {
    if (this.currentLocale === locale) return;
    this.currentLocale = locale;
    await this.loadMessages(locale);

    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    settings.language = locale;
    await chrome.storage.local.set({ settings });

    this.applyToPage();
    this.updateLanguageSelector();

    window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));
  },

  applyToPage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      if (attr) {
        el.setAttribute(attr, this.t(key));
      } else {
        el.textContent = this.t(key);
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.t(key);
    });

    document.documentElement.lang = this.currentLocale === 'zh_CN' ? 'zh-CN' : this.currentLocale;
  },

  updateLanguageSelector() {
    const selector = document.getElementById('langSelector');
    if (selector) {
      selector.value = this.currentLocale;
    }
  },

  getLocale() {
    return this.currentLocale;
  },

  getSupportedLocales() {
    return [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'zh_CN', name: '中文', native: '中文' },
      { code: 'es', name: 'Español', native: 'Español' },
      { code: 'ja', name: '日本語', native: '日本語' },
      { code: 'de', name: 'Deutsch', native: 'Deutsch' }
    ];
  }
};

// Shortcut for convenience
const _t = (key, subs) => I18n.t(key, subs);
