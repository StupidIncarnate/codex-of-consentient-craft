import { hasFolderTypeSuffixGuard } from './has-folder-type-suffix-guard';

describe('hasFolderTypeSuffixGuard', () => {
  describe('valid folder type suffixes', () => {
    it('VALID: {name: "user-fetch-broker"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'user-fetch-broker' });

      expect(result).toBe(true);
    });

    it('VALID: {name: "http-adapter"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'http-adapter' });

      expect(result).toBe(true);
    });

    it('VALID: {name: "format-date-transformer"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'format-date-transformer' });

      expect(result).toBe(true);
    });

    it('VALID: {name: "is-valid-guard"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'is-valid-guard' });

      expect(result).toBe(true);
    });

    it('VALID: {name: "user-widget"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'user-widget' });

      expect(result).toBe(true);
    });

    it('VALID: {name: "api-statics"} => returns true', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'api-statics' });

      expect(result).toBe(true);
    });
  });

  describe('invalid folder type suffixes', () => {
    it('VALID: {name: "user-fetch"} => returns false', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'user-fetch' });

      expect(result).toBe(false);
    });

    it('VALID: {name: "broker"} => returns false', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'broker' });

      expect(result).toBe(false);
    });

    it('VALID: {name: "user"} => returns false', () => {
      const result = hasFolderTypeSuffixGuard({ name: 'user' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {name: ""} => returns false', () => {
      const result = hasFolderTypeSuffixGuard({ name: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      const result = hasFolderTypeSuffixGuard({});

      expect(result).toBe(false);
    });
  });
});
