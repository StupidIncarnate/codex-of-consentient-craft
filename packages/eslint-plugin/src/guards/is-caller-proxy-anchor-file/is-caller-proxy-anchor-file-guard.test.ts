import { isCallerProxyAnchorFileGuard } from './is-caller-proxy-anchor-file-guard';

describe('isCallerProxyAnchorFileGuard', () => {
  describe('anchor files', () => {
    it('VALID: {filename: "/repo/packages/config/src/startup/start-config.ts"} => returns true', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/config/src/startup/start-config.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/repo/packages/x/src/startup/start-multi-word.tsx"} => returns true', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/x/src/startup/start-multi-word.tsx',
      });

      expect(result).toBe(true);
    });
  });

  describe('other files', () => {
    it('VALID: {a startup file one folder deeper} => returns false', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/config/src/startup/nested/start-config.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {a proxy beside the anchor} => returns false', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/config/src/startup/start-config.proxy.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {a file outside startup} => returns false', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/config/src/brokers/start-config.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {a startup file not named start-*} => returns false', () => {
      const result = isCallerProxyAnchorFileGuard({
        filename: '/repo/packages/config/src/startup/config.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns false', () => {
      const result = isCallerProxyAnchorFileGuard({});

      expect(result).toBe(false);
    });
  });
});
