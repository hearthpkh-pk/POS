// Utils Test Suite
import { Utils } from '../src/js/utils.js';

describe('Utils', () => {
  describe('Date utilities', () => {
    test('getTodayDateString should return today\'s date in YYYY-MM-DD format', () => {
      const mockDate = new Date('2023-12-25T10:00:00Z');
      const originalDate = Date;
      Date = jest.fn(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      const result = Utils.getTodayDateString();
      expect(result).toBe('2023-12-25');
      
      Date = originalDate;
    });

    test('formatCurrency should format Thai Baht correctly', () => {
      const result = Utils.formatCurrency(1234.56);
      expect(result).toContain('฿');
      expect(result).toContain('1,234.56');
    });

    test('roundToTwo should round to 2 decimal places', () => {
      expect(Utils.roundToTwo(123.456)).toBe(123.46);
      expect(Utils.roundToTwo(123.454)).toBe(123.45);
      expect(Utils.roundToTwo(123.4)).toBe(123.4);
    });
  });

  describe('Array utilities', () => {
    test('unique should remove duplicates', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 1 }];
      const result = Utils.unique(arr, 'id');
      expect(result).toHaveLength(2);
      expect(result.map(item => item.id)).toEqual([1, 2]);
    });

    test('groupBy should group objects by key', () => {
      const arr = [
        { category: 'food', name: 'Pizza' },
        { category: 'drink', name: 'Coke' },
        { category: 'food', name: 'Burger' }
      ];
      const result = Utils.groupBy(arr, 'category');
      
      expect(result).toHaveProperty('food');
      expect(result).toHaveProperty('drink');
      expect(result.food).toHaveLength(2);
      expect(result.drink).toHaveLength(1);
    });

    test('sortBy should sort array by key', () => {
      const arr = [
        { name: 'Banana', price: 30 },
        { name: 'Apple', price: 50 },
        { name: 'Orange', price: 20 }
      ];
      
      const resultAsc = Utils.sortBy(arr, 'price', 'asc');
      expect(resultAsc[0].price).toBe(20);
      expect(resultAsc[2].price).toBe(50);
      
      const resultDesc = Utils.sortBy(arr, 'price', 'desc');
      expect(resultDesc[0].price).toBe(50);
      expect(resultDesc[2].price).toBe(20);
    });
  });

  describe('String utilities', () => {
    test('slugify should convert string to slug', () => {
      expect(Utils.slugify('Hello World!')).toBe('hello-world');
      expect(Utils.slugify('  Test   String  ')).toBe('test-string');
      expect(Utils.slugify('Special@#$%Characters')).toBe('specialcharacters');
    });

    test('truncate should truncate long strings', () => {
      expect(Utils.truncate('Hello World', 5)).toBe('Hello...');
      expect(Utils.truncate('Hello', 10)).toBe('Hello');
      expect(Utils.truncate('Hello World', 8, '---')).toBe('Hello---');
    });

    test('capitalize should capitalize first letter', () => {
      expect(Utils.capitalize('hello')).toBe('Hello');
      expect(Utils.capitalize('HELLO')).toBe('Hello');
      expect(Utils.capitalize('hELLO')).toBe('Hello');
    });
  });

  describe('Storage utilities', () => {
    beforeEach(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    test('setSessionStorage and getSessionStorage should work together', () => {
      const testData = { key: 'value' };
      
      Utils.setSessionStorage('test', testData);
      const result = Utils.getSessionStorage('test');
      
      expect(result).toEqual(testData);
    });

    test('getSessionStorage should return default value when not found', () => {
      const result = Utils.getSessionStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    test('removeSessionStorage should remove item', () => {
      Utils.setSessionStorage('test', 'value');
      Utils.removeSessionStorage('test');
      
      const result = Utils.getSessionStorage('test');
      expect(result).toBe(null);
    });
  });

  describe('Validation utilities', () => {
    test('isValidEmail should validate email addresses', () => {
      expect(Utils.isValidEmail('test@example.com')).toBe(true);
      expect(Utils.isValidEmail('invalid-email')).toBe(false);
      expect(Utils.isValidEmail('test@')).toBe(false);
      expect(Utils.isValidEmail('@example.com')).toBe(false);
    });

    test('isValidPhone should validate phone numbers', () => {
      expect(Utils.isValidPhone('0812345678')).toBe(true);
      expect(Utils.isValidPhone('080-000-0000')).toBe(true);
      expect(Utils.isValidPhone('123')).toBe(false);
      expect(Utils.isValidPhone('abcdefgh')).toBe(false);
    });

    test('isValidPrice should validate prices', () => {
      expect(Utils.isValidPrice(100)).toBe(true);
      expect(Utils.isValidPrice(99.99)).toBe(true);
      expect(Utils.isValidPrice(0)).toBe(false);
      expect(Utils.isValidPrice(-10)).toBe(false);
      expect(Utils.isValidPrice('invalid')).toBe(false);
    });
  });

  describe('Utility functions', () => {
    test('generateId should generate unique IDs', () => {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();
      
      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(8);
      expect(id1).not.toBe(id2);
    });

    test('generateId should work with prefix', () => {
      const id = Utils.generateId('test', 4);
      expect(id).toMatch(/^test-[a-zA-Z0-9]{4}$/);
    });

    test('debounce should delay function execution', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    test('throttle should limit function execution', (done) => {
      const mockFn = jest.fn();
      const throttledFn = Utils.throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      setTimeout(() => {
        throttledFn();
        expect(mockFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });
  });

  describe('Object utilities', () => {
    test('deepClone should create deep copy', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4] }
      };
      
      const cloned = Utils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });

    test('mergeDeep should merge objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      
      const result = Utils.mergeDeep(obj1, obj2);
      
      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      });
    });

    test('isObject should identify objects', () => {
      expect(Utils.isObject({})).toBe(true);
      expect(Utils.isObject([])).toBe(false);
      expect(Utils.isObject(null)).toBe(false);
      expect(Utils.isObject('string')).toBe(false);
    });
  });

  describe('File utilities', () => {
    test('convertToCSV should convert array to CSV', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      
      const csv = Utils.convertToCSV(data);
      
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
      expect(csv).toContain('Jane,25');
    });

    test('convertToCSV should handle special characters', () => {
      const data = [
        { name: 'John, Jr.', description: 'Has "quotes"' }
      ];
      
      const csv = Utils.convertToCSV(data);
      
      expect(csv).toContain('"John, Jr."');
      expect(csv).toContain('"Has ""quotes"""');
    });
  });

  describe('Error handling', () => {
    test('createError should create error with metadata', () => {
      const error = Utils.createError('Test error', 'TEST_CODE', { details: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ details: 'test' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('logError should log error with context', () => {
      const error = Utils.createError('Test error');
      const consoleSpy = jest.spyOn(console, 'error');
      
      Utils.logError(error, { context: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Application Error:',
        expect.objectContaining({
          message: 'Test error',
          context: { context: 'test' }
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
