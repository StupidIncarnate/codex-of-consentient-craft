import { startupExportsAsyncNamespaceGuard } from './startup-exports-async-namespace-guard';

describe('startupExportsAsyncNamespaceGuard', () => {
  describe('true cases', () => {
    it('VALID: content exports object with async function property => returns true', () => {
      const result = startupExportsAsyncNamespaceGuard({
        startupFileContent:
          'export const StartOrchestrator = {\n  startQuest: async ({ questId }) => {\n    return questId;\n  },\n};',
      });

      expect(result).toBe(true);
    });

    it('VALID: content exports object literal with inline async arrow => returns true', () => {
      const result = startupExportsAsyncNamespaceGuard({
        startupFileContent: 'export const StartApi = { doThing: async (x) => x };',
      });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: content exports a non-object async function => returns false', () => {
      const result = startupExportsAsyncNamespaceGuard({
        startupFileContent: 'export const startServer = async () => { return true; };',
      });

      expect(result).toBe(false);
    });

    it('INVALID: content exports object but no async property => returns false', () => {
      const result = startupExportsAsyncNamespaceGuard({
        startupFileContent: 'export const Config = { port: 3000, host: "localhost" };',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: startupFileContent is empty string => returns false', () => {
      const result = startupExportsAsyncNamespaceGuard({ startupFileContent: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: startupFileContent is undefined => returns false', () => {
      const result = startupExportsAsyncNamespaceGuard({});

      expect(result).toBe(false);
    });
  });
});
