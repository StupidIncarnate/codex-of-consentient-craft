import { binResolveBroker } from './bin-resolve-broker';
import { binResolveBrokerProxy } from './bin-resolve-broker.proxy';

describe('binResolveBroker', () => {
  describe('binary exists in node_modules/.bin', () => {
    it('VALID: {eslint exists in .bin} => returns absolute path to binary', () => {
      const proxy = binResolveBrokerProxy();
      const cwd = '/project';
      const binName = 'eslint';
      proxy.setupFound({ cwd, binName });

      const result = binResolveBroker({ binName, cwd });

      expect(result).toBe('/project/node_modules/.bin/eslint');
    });
  });

  describe('binary only in the workspace root', () => {
    it('VALID: {jest in /repo/node_modules/.bin, cwd /repo/packages/ward} => returns the root path', () => {
      const proxy = binResolveBrokerProxy();
      const cwd = '/repo/packages/ward';
      const root = '/repo';
      const binName = 'jest';
      proxy.setupFoundAt({ cwd, binName, binDir: root, workspaceRoot: root });

      const result = binResolveBroker({ binName, cwd });

      expect(result).toBe('/repo/node_modules/.bin/jest');
    });
  });

  describe('binary not found in node_modules/.bin', () => {
    it('VALID: {eslint not in .bin} => returns bare binary name', () => {
      const proxy = binResolveBrokerProxy();
      const cwd = '/project';
      const binName = 'eslint';
      proxy.setupNotFound({ cwd, binName });

      const result = binResolveBroker({ binName, cwd });

      expect(result).toBe('eslint');
    });
  });
});
