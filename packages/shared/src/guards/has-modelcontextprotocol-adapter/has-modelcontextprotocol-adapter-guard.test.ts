import { hasModelcontextprotocolAdapterGuard } from './has-modelcontextprotocol-adapter-guard';

describe('hasModelcontextprotocolAdapterGuard', () => {
  describe('true cases', () => {
    it('VALID: adapterDirNames includes @modelcontextprotocol => returns true', () => {
      const result = hasModelcontextprotocolAdapterGuard({
        adapterDirNames: ['@modelcontextprotocol', 'fs'],
      });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: adapterDirNames has no @modelcontextprotocol => returns false', () => {
      const result = hasModelcontextprotocolAdapterGuard({ adapterDirNames: ['hono', 'fs'] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is empty array => returns false', () => {
      const result = hasModelcontextprotocolAdapterGuard({ adapterDirNames: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: adapterDirNames is undefined => returns false', () => {
      const result = hasModelcontextprotocolAdapterGuard({});

      expect(result).toBe(false);
    });
  });
});
