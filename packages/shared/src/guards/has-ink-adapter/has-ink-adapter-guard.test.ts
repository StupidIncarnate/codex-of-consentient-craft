import { hasInkAdapterGuard } from './has-ink-adapter-guard';

describe('hasInkAdapterGuard', () => {
  describe('true cases', () => {
    it('VALID: adapterDirNames includes ink => returns true', () => {
      const result = hasInkAdapterGuard({ adapterDirNames: ['ink', 'fs'] });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: adapterDirNames has no ink => returns false', () => {
      const result = hasInkAdapterGuard({ adapterDirNames: ['hono', 'fs'] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is empty array => returns false', () => {
      const result = hasInkAdapterGuard({ adapterDirNames: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is undefined => returns false', () => {
      const result = hasInkAdapterGuard({});

      expect(result).toBe(false);
    });
  });
});
