// logger.js - Debug logging system with rotation and export

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
const DEFAULT_MAX_ENTRIES = 500;
const STORAGE_KEY_LOGS = 'appLogs';
const STORAGE_KEY_SETTINGS = 'logSettings';

class Logger {
  constructor() {
    this._settings = null;
  }

  async _getSettings() {
    if (this._settings) return this._settings;
    const result = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
    this._settings = result[STORAGE_KEY_SETTINGS] || {
      enabled: false,
      level: LogLevel.INFO,
      maxEntries: DEFAULT_MAX_ENTRIES
    };
    return this._settings;
  }

  async _saveSettings() {
    if (this._settings) {
      await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: this._settings });
    }
  }

  async _writeLog(level, module, message, details = null) {
    const settings = await this._getSettings();
    if (!settings.enabled) return;
    if (level > settings.level) return;

    const entry = {
      timestamp: Date.now(),
      level,
      module,
      message,
      details
    };

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_LOGS);
      let logs = result[STORAGE_KEY_LOGS] || [];
      logs.push(entry);

      const maxEntries = settings.maxEntries || DEFAULT_MAX_ENTRIES;
      if (logs.length > maxEntries) {
        logs = logs.slice(-maxEntries);
      }

      await chrome.storage.local.set({ [STORAGE_KEY_LOGS]: logs });
    } catch (e) {
      console.error('Logger write failed:', e);
    }
  }

  async error(module, message, details) {
    await this._writeLog(LogLevel.ERROR, module, message, details);
  }

  async warn(module, message, details) {
    await this._writeLog(LogLevel.WARN, module, message, details);
  }

  async info(module, message, details) {
    await this._writeLog(LogLevel.INFO, module, message, details);
  }

  async debug(module, message, details) {
    await this._writeLog(LogLevel.DEBUG, module, message, details);
  }

  async getLogs() {
    const result = await chrome.storage.local.get(STORAGE_KEY_LOGS);
    return result[STORAGE_KEY_LOGS] || [];
  }

  async getLogCount() {
    const logs = await this.getLogs();
    return logs.length;
  }

  async clearLogs() {
    await chrome.storage.local.remove(STORAGE_KEY_LOGS);
  }

  async exportLogs() {
    const logs = await this.getLogs();
    if (logs.length === 0) {
      return null;
    }

    const exportData = {
      exportTime: new Date().toISOString(),
      extension: 'Bookmark Organizer',
      total: logs.length,
      logs: logs.map(entry => ({
        ...entry,
        levelName: LOG_LEVEL_NAMES[entry.level] || 'UNKNOWN'
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `bookmark-organizer-logs-${new Date().toISOString().slice(0, 10)}.json`;
    return { url, filename };
  }

  async getSettings() {
    return await this._getSettings();
  }

  async updateSettings(newSettings) {
    this._settings = {
      ...(this._settings || await this._getSettings()),
      ...newSettings
    };
    await this._saveSettings();
  }

  invalidateCache() {
    this._settings = null;
  }
}

export const logger = new Logger();
