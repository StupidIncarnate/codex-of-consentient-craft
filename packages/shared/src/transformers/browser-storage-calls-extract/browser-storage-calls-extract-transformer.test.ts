import { browserStorageCallsExtractTransformer } from './browser-storage-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('browserStorageCallsExtractTransformer', () => {
  describe('localStorage', () => {
    it('VALID: {localStorage.setItem with single-quoted key} => returns localStorage: key', () => {
      const source = ContentTextStub({
        value: `localStorage.setItem('session-id', value);`,
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['localStorage: session-id']);
    });

    it('VALID: {localStorage.setItem with double-quoted key} => returns localStorage: key', () => {
      const source = ContentTextStub({
        value: `localStorage.setItem("theme", "dark");`,
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['localStorage: theme']);
    });
  });

  describe('sessionStorage', () => {
    it('VALID: {sessionStorage.setItem} => returns sessionStorage: key', () => {
      const source = ContentTextStub({
        value: `sessionStorage.setItem('auth-token', token);`,
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['sessionStorage: auth-token']);
    });
  });

  describe('indexedDB', () => {
    it('VALID: {indexedDB.open} => returns indexedDB: name', () => {
      const source = ContentTextStub({
        value: `const db = indexedDB.open('my-database', 1);`,
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['indexedDB: my-database']);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {localStorage and sessionStorage in same file} => returns both in order', () => {
      const source = ContentTextStub({
        value: [
          `localStorage.setItem('user-pref', value);`,
          `sessionStorage.setItem('csrf-token', token);`,
        ].join('\n'),
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['localStorage: user-pref', 'sessionStorage: csrf-token']);
    });
  });

  describe('no calls', () => {
    it('EMPTY: {source with no storage calls} => returns empty array', () => {
      const source = ContentTextStub({
        value: `const x = 42;`,
      });

      const result = browserStorageCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
