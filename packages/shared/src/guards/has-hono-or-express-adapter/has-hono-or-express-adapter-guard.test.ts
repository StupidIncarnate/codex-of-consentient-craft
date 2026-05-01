import { hasHonoOrExpressAdapterGuard } from './has-hono-or-express-adapter-guard';

describe('hasHonoOrExpressAdapterGuard', () => {
  describe('true cases', () => {
    it('VALID: adapterDirNames includes hono => returns true', () => {
      const result = hasHonoOrExpressAdapterGuard({ adapterDirNames: ['hono', 'fs'] });

      expect(result).toBe(true);
    });

    it('VALID: adapterDirNames includes express => returns true', () => {
      const result = hasHonoOrExpressAdapterGuard({ adapterDirNames: ['express', 'fs'] });

      expect(result).toBe(true);
    });

    it('VALID: adapterDirNames includes both hono and express => returns true', () => {
      const result = hasHonoOrExpressAdapterGuard({ adapterDirNames: ['hono', 'express'] });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: adapterDirNames has no hono or express => returns false', () => {
      const result = hasHonoOrExpressAdapterGuard({ adapterDirNames: ['fs', 'ink'] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is empty array => returns false', () => {
      const result = hasHonoOrExpressAdapterGuard({ adapterDirNames: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is undefined => returns false', () => {
      const result = hasHonoOrExpressAdapterGuard({});

      expect(result).toBe(false);
    });
  });
});
