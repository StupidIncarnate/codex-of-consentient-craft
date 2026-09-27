/**
 * PURPOSE: Unit tests for InstallConfigCreateResponder using proxy pattern
 *
 * USAGE:
 * npm run ward -- --only test -- packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FsErrorStub } from '#gateway/node/_test_/fs';
import { dungeonmasterConfigCreatorTransformer } from '../../../transformers/dungeonmaster-config-creator/dungeonmaster-config-creator-transformer';
import { InstallConfigCreateResponderProxy } from './install-config-create-responder.proxy';

describe('InstallConfigCreateResponder', () => {
  describe('no existing config', () => {
    it('VALID: {no .mcp.json} => creates new config with dungeonmaster', async () => {
      const proxy = InstallConfigCreateResponderProxy();
      const targetProjectRoot = FilePathStub({ value: '/project' });

      proxy.setupFileMissing({ targetProjectRoot });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot,
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });

      const writtenConfig = proxy.getWrittenConfig({ targetProjectRoot });

      expect(writtenConfig).toBe(
        JSON.stringify(
          {
            mcpServers: dungeonmasterConfigCreatorTransformer(),
          },
          null,
          2,
        ),
      );
    });
  });

  describe('existing config with dungeonmaster', () => {
    it('VALID: {dungeonmaster already configured} => skips config but adds permissions', async () => {
      const proxy = InstallConfigCreateResponderProxy();
      const targetProjectRoot = FilePathStub({ value: '/project' });

      proxy.setupFileRead({
        targetProjectRoot,
        content: JSON.stringify({
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              command: 'node',
              args: ['-e', "require('@dungeonmaster/mcp')"],
            },
          },
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot,
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'skipped',
        message: 'MCP config already exists, added permissions',
      });
    });
  });

  describe('existing config without dungeonmaster', () => {
    it('VALID: {other servers configured} => merges dungeonmaster config', async () => {
      const proxy = InstallConfigCreateResponderProxy();
      const targetProjectRoot = FilePathStub({ value: '/project' });

      proxy.setupFileRead({
        targetProjectRoot,
        content: JSON.stringify({
          mcpServers: {
            other: {
              type: 'http',
              command: 'node',
              args: ['server.js'],
            },
          },
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot,
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'merged',
        message: 'Merged dungeonmaster into existing .mcp.json and added permissions',
      });

      const writtenConfig = proxy.getWrittenConfig({ targetProjectRoot });

      expect(writtenConfig).toBe(
        JSON.stringify(
          {
            mcpServers: {
              other: {
                type: 'http',
                command: 'node',
                args: ['server.js'],
              },
              ...dungeonmasterConfigCreatorTransformer(),
            },
          },
          null,
          2,
        ),
      );
    });
  });

  describe('invalid JSON config', () => {
    it('ERROR: {invalid JSON in .mcp.json} => rejects naming the file and never writes', async () => {
      const proxy = InstallConfigCreateResponderProxy();
      const targetProjectRoot = FilePathStub({ value: '/project' });

      proxy.setupCorruptFile({ targetProjectRoot, rawContents: 'invalid json{' });

      await expect(
        proxy.callResponder({
          context: {
            targetProjectRoot,
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      ).rejects.toThrow(/Invalid JSON in .*\.mcp\.json/u);

      expect(proxy.getWrittenConfig({ targetProjectRoot })).toBe(undefined);
    });
  });

  describe('permission denied reading config', () => {
    it('ERROR: {EACCES reading .mcp.json} => rejects naming the file and never writes', async () => {
      const proxy = InstallConfigCreateResponderProxy();
      const targetProjectRoot = FilePathStub({ value: '/project' });
      const configPath = '/project/.mcp.json';

      proxy.setupFileReadError({
        targetProjectRoot,
        error: FsErrorStub({ code: 'EACCES', path: configPath, syscall: 'open' }),
      });

      await expect(
        proxy.callResponder({
          context: {
            targetProjectRoot,
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      ).rejects.toThrow(/EACCES.*\.mcp\.json/u);

      expect(proxy.getWrittenConfig({ targetProjectRoot })).toBe(undefined);
    });
  });
});
