import { hasWidgetsFolderGuard } from './has-widgets-folder-guard';

describe('hasWidgetsFolderGuard', () => {
  describe('true cases', () => {
    it('VALID: srcDirNames includes widgets => returns true', () => {
      const result = hasWidgetsFolderGuard({ srcDirNames: ['widgets', 'brokers'] });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: srcDirNames has no widgets => returns false', () => {
      const result = hasWidgetsFolderGuard({ srcDirNames: ['brokers', 'contracts'] });

      expect(result).toBe(false);
    });

    it('EMPTY: srcDirNames is empty array => returns false', () => {
      const result = hasWidgetsFolderGuard({ srcDirNames: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: srcDirNames is undefined => returns false', () => {
      const result = hasWidgetsFolderGuard({});

      expect(result).toBe(false);
    });
  });
});
