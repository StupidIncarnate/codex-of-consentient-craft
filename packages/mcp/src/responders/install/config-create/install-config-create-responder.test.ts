/**
 * PURPOSE: Unit tests for InstallConfigCreateResponder using proxy pattern
 *
 * USAGE:
 * npm run ward -- --only test -- packages/mcp/src/responders/install/config-create/install-config-create-responder.test.ts
 */

import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { InstallConfigCreateResponderProxy } from './install-config-create-responder.proxy';

describe('InstallConfigCreateResponder', () => {
  describe('no existing config', () => {
    it('VALID: {no .mcp.json} => creates new config with dungeonmaster', async () => {
      const proxy = InstallConfigCreateResponderProxy();

      proxy.setupFileReadError();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });

      const writtenConfig = proxy.getWrittenConfig();

      expect(writtenConfig).toContain('"dungeonmaster"');
      expect(writtenConfig).toContain('"type": "stdio"');
      expect(writtenConfig).toContain('@dungeonmaster/mcp');
    });
  });

  describe('existing config with dungeonmaster', () => {
    it('VALID: {dungeonmaster already configured} => skips config but adds permissions', async () => {
      const proxy = InstallConfigCreateResponderProxy();

      proxy.setupFileRead({
        content: FileContentsStub({
          value: JSON.stringify({
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          }),
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
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

      proxy.setupFileRead({
        content: FileContentsStub({
          value: JSON.stringify({
            mcpServers: {
              other: {
                type: 'http',
                command: 'node',
                args: ['server.js'],
              },
            },
          }),
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'merged',
        message: 'Merged dungeonmaster into existing .mcp.json and added permissions',
      });

      const writtenConfig = proxy.getWrittenConfig();

      expect(writtenConfig).toContain('"other"');
      expect(writtenConfig).toContain('"dungeonmaster"');
    });
  });

  describe('invalid JSON config', () => {
    it('VALID: {invalid JSON in .mcp.json} => creates new config', async () => {
      const proxy = InstallConfigCreateResponderProxy();

      proxy.setupFileRead({
        content: FileContentsStub({ value: 'invalid json{' }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });

      const writtenConfig = proxy.getWrittenConfig();

      expect(writtenConfig).toContain('"dungeonmaster"');
    });
  });
});
