import { architectureGatewayInventoryBroker } from './architecture-gateway-inventory-broker';
import { architectureGatewayInventoryBrokerProxy } from './architecture-gateway-inventory-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureGatewayInventoryBroker', () => {
  describe('every group with no subpaths', () => {
    it('EMPTY: {no subpaths anywhere} => every group renders (empty), in npm/node/browser/bin order', () => {
      architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          '  (empty)',
          '',
          '### node',
          '  (empty)',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  (empty)',
        ].join('\n'),
      );
    });
  });

  describe('a subpath that wraps a real Node module', () => {
    it('VALID: {node/fs subpath with one wrapper} => passes-through line plus an ours: line', () => {
      const proxy = architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      proxy.setupSubpath({
        projectRoot,
        folder: 'node',
        subpathName: 'fs',
        barrelContent: ContentTextStub({
          value: [
            "export * from 'fs';",
            "export { existsSync } from './exists-sync/exists-sync';",
          ].join('\n'),
        }),
      });

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          '  (empty)',
          '',
          '### node',
          "  #gateway/node/fs  passes through 'fs'",
          '      ours: existsSync',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  (empty)',
        ].join('\n'),
      );
    });
  });

  describe('a pure pass-through subpath with no wrappers of our own', () => {
    it('VALID: {npm/zod subpath, no relative export lines} => passes-through line with no ours: line', () => {
      const proxy = architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      proxy.setupSubpath({
        projectRoot,
        folder: 'npm',
        subpathName: 'zod',
        barrelContent: ContentTextStub({
          value: ["export * from 'zod';", "export { default } from 'zod';"].join('\n'),
        }),
      });

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          "  #gateway/npm/zod  passes through 'zod'",
          '',
          '### node',
          '  (empty)',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  (empty)',
        ].join('\n'),
      );
    });
  });

  describe('a bin subpath (no real module)', () => {
    it('VALID: {bin/claude subpath, no export * line} => no passes-through phrase, only the ours: line', () => {
      const proxy = architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      proxy.setupSubpath({
        projectRoot,
        folder: 'bin',
        subpathName: 'claude',
        barrelContent: ContentTextStub({
          value: [
            "export { resolveClaudeCliPath } from './resolve-claude-cli-path/resolve-claude-cli-path';",
            "export { spawnStreamJson } from './spawn-stream-json/spawn-stream-json';",
          ].join('\n'),
        }),
      });

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          '  (empty)',
          '',
          '### node',
          '  (empty)',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  #gateway/bin/claude',
          '      ours: resolveClaudeCliPath, spawnStreamJson',
        ].join('\n'),
      );
    });
  });

  describe('a subpath directory that has no matching barrel file', () => {
    it('EDGE: {subpath dir exists, barrel file does not} => renders only the bare subpath line', () => {
      const proxy = architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      proxy.setupSubpath({ projectRoot, folder: 'node', subpathName: 'child_process' });

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          '  (empty)',
          '',
          '### node',
          '  #gateway/node/child_process',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  (empty)',
        ].join('\n'),
      );
    });
  });

  describe('a wrapper the gateway config bans', () => {
    it('VALID: {readFile banned on #gateway/node/fs__promises} => the ours: line marks it', () => {
      const proxy = architectureGatewayInventoryBrokerProxy();
      const projectRoot = '/repo';

      proxy.setupSubpath({
        projectRoot,
        folder: 'node',
        subpathName: 'fs__promises',
        barrelContent: ContentTextStub({
          value: [
            "export * from 'fs/promises';",
            "export { readFile } from './read-file/read-file';",
          ].join('\n'),
        }),
      });
      proxy.setupGatewayLintConfig({
        repoRoot: projectRoot,
        fileContent: ContentTextStub({
          value: JSON.stringify({
            gateway: {
              bannedExports: [
                {
                  subpath: '#gateway/node/fs__promises',
                  name: 'readFile',
                  use: 'readTextFile',
                  reason: 'blocks the loop',
                },
              ],
            },
          }),
        }),
      });

      const result = architectureGatewayInventoryBroker({ projectRoot });

      expect(result).toBe(
        [
          '### npm',
          '  (empty)',
          '',
          '### node',
          "  #gateway/node/fs__promises  passes through 'fs/promises'",
          '      ours: readFile ✗ banned, use readTextFile',
          '',
          '### browser',
          '  (empty)',
          '',
          '### bin',
          '  (empty)',
        ].join('\n'),
      );
    });
  });
});
