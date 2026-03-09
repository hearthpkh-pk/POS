// Utility Functions
import { CONSTANTS } from './config/constants.js';

export class Utils {
  // Date & Timezone utilities
  static getBangkokTime(date = new Date()) {
    // Return Date object adjusted to Bangkok timezone (+7)
    // Actually, in JS it's better to work with ISO strings for DB and let the Date formatted by Intl
    const bangkokStr = new Date(date).toLocaleString('en-US', { timeZone: CONSTANTS.TIMEZONE });
    return new Date(bangkokStr);
  }

  static getTodayDateString(date = new Date()) {
    const d = this.getBangkokTime(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static formatDateTime(date, options = {}) {
    const defaultOptions = {
      dateStyle: 'short',
      timeStyle: 'short',
      locale: CONSTANTS.LOCALE,
      timeZone: CONSTANTS.TIMEZONE
    };
    const finalOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleString(finalOptions.locale, finalOptions);
  }

  static formatDate(date, options = {}) {
    const defaultOptions = {
      dateStyle: 'short',
      locale: CONSTANTS.LOCALE,
      timeZone: CONSTANTS.TIMEZONE
    };
    const finalOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleDateString(finalOptions.locale, finalOptions);
  }

  static formatTime(date, options = {}) {
    const defaultOptions = {
      timeStyle: 'short',
      locale: CONSTANTS.LOCALE,
      timeZone: CONSTANTS.TIMEZONE
    };
    const finalOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleTimeString(finalOptions.locale, finalOptions);
  }

  // Financial (Integer Math) utilities
  // Resolves IEEE 754 Floating-Point errors by storing currency as integer cents

  static bahtToCents(baht) {
    if (!baht || isNaN(baht)) return 0;
    return Math.round(Number(baht) * 100);
  }

  static centsToBaht(cents) {
    if (!cents || isNaN(cents)) return 0;
    return Number(cents) / 100;
  }

  static formatCurrency(amountCents, currency = CONSTANTS.CURRENCY) {
    const amountBaht = this.centsToBaht(amountCents);
    return new Intl.NumberFormat(CONSTANTS.LOCALE, {
      style: 'currency',
      currency: currency
    }).format(amountBaht);
  }

  static parseCurrency(string) {
    const floatVal = parseFloat(string.replace(/[^\d.-]/g, ''));
    return this.bahtToCents(floatVal);
  }

  // Number utilities
  static roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  // String utilities
  static slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static truncate(text, length, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }

  static capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Array utilities
  static unique(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  }

  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  static sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }

  // Object utilities
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  static mergeDeep(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Validation utilities
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static isValidPrice(price) {
    return !isNaN(price) && price > 0;
  }

  // Storage utilities
  static setSessionStorage(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Session storage error:', error);
      return false;
    }
  }

  static getSessionStorage(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Session storage error:', error);
      return defaultValue;
    }
  }

  static removeSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Session storage error:', error);
      return false;
    }
  }

  static setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Local storage error:', error);
      return false;
    }
  }

  static getLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Local storage error:', error);
      return defaultValue;
    }
  }

  static removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Local storage error:', error);
      return false;
    }
  }

  // Debounce utility
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle utility
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Generate unique ID
  static generateId(prefix = '', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix ? `${prefix}-${result}` : result;
  }

  // File utilities
  static downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static downloadCSV(data, filename) {
    const csv = this.convertToCSV(data);
    this.downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;');
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  // Error handling
  static createError(message, code = null, details = null) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = new Date();
    return error;
  }

  static logError(error, context = {}) {
    console.error('Application Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
      context
    });
  }

  // Performance utilities
  static measureTime(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }

  static async measureTimeAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
}

// Export commonly used functions
export const {
  getBangkokTime,
  getTodayDateString,
  bahtToCents,
  centsToBaht,
  formatCurrency,
  roundToTwo,
  debounce,
  throttle,
  generateId,
  downloadCSV,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage
} = Utils;
