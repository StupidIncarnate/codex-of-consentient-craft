import { StartInstall } from './start-install';
import { StartInstallProxy } from './start-install.proxy';
import {
  InstallContextStub,
  FilePathStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

describe('StartInstall', () => {
  describe('install()', () => {
    it('VALID: config exists with dungeonmaster => skips installation', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dungeonmaster',
        },
      });

      const configPath = FilePathStub({ value: '/project/.mcp.json' });
      const existingConfig = FileContentsStub({
        value: JSON.stringify({
          mcpServers: {
            dungeonmaster: {
              type: 'stdio',
              command: 'npx',
              args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
            },
          },
        }),
      });

      proxy.pathJoin.returns({
        paths: [context.targetProjectRoot, '.mcp.json'],
        result: configPath,
      });
      proxy.fsReadFile.returns({ filepath: configPath, contents: existingConfig });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'skipped',
        message: 'MCP config already exists',
      });
    });

    it('VALID: config exists without dungeonmaster => merges config', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dungeonmaster',
        },
      });

      const configPath = FilePathStub({ value: '/project/.mcp.json' });
      const existingConfig = FileContentsStub({
        value: JSON.stringify({
          mcpServers: {
            other: {
              type: 'http',
              command: 'node',
              args: ['server.js'],
            },
          },
        }),
      });

      const expectedMergedConfig = FileContentsStub({
        value: JSON.stringify(
          {
            mcpServers: {
              other: {
                type: 'http',
                command: 'node',
                args: ['server.js'],
              },
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({
        paths: [context.targetProjectRoot, '.mcp.json'],
        result: configPath,
      });
      proxy.fsReadFile.returns({ filepath: configPath, contents: existingConfig });
      proxy.fsWriteFile.succeeds({ filepath: configPath, contents: expectedMergedConfig });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'merged',
        message: 'Merged dungeonmaster into existing .mcp.json',
      });
    });

    it('VALID: config does not exist => creates new config', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dungeonmaster',
        },
      });

      const configPath = FilePathStub({ value: '/project/.mcp.json' });
      const expectedNewConfig = FileContentsStub({
        value: JSON.stringify(
          {
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({
        paths: [context.targetProjectRoot, '.mcp.json'],
        result: configPath,
      });
      proxy.fsReadFile.throws({ filepath: configPath, error: new Error('ENOENT: file not found') });
      proxy.fsWriteFile.succeeds({ filepath: configPath, contents: expectedNewConfig });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config',
      });
    });

    it('VALID: config exists with invalid JSON => creates new config', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dungeonmaster',
        },
      });

      const configPath = FilePathStub({ value: '/project/.mcp.json' });
      const invalidConfig = FileContentsStub({ value: 'invalid json{' });
      const expectedNewConfig = FileContentsStub({
        value: JSON.stringify(
          {
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({
        paths: [context.targetProjectRoot, '.mcp.json'],
        result: configPath,
      });
      proxy.fsReadFile.returns({ filepath: configPath, contents: invalidConfig });
      proxy.fsWriteFile.succeeds({ filepath: configPath, contents: expectedNewConfig });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config',
      });
    });

    it('VALID: preserves other mcpServers entries when merging', async () => {
      const proxy = StartInstallProxy();

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dungeonmaster',
        },
      });

      const configPath = FilePathStub({ value: '/project/.mcp.json' });
      const existingConfig = FileContentsStub({
        value: JSON.stringify({
          mcpServers: {
            server1: {
              type: 'http',
              command: 'node',
              args: ['app1.js'],
            },
            server2: {
              type: 'stdio',
              command: 'python',
              args: ['app2.py'],
            },
          },
        }),
      });

      const expectedMergedConfig = FileContentsStub({
        value: JSON.stringify(
          {
            mcpServers: {
              server1: {
                type: 'http',
                command: 'node',
                args: ['app1.js'],
              },
              server2: {
                type: 'stdio',
                command: 'python',
                args: ['app2.py'],
              },
              dungeonmaster: {
                type: 'stdio',
                command: 'npx',
                args: ['tsx', 'node_modules/@dungeonmaster/mcp/src/index.ts'],
              },
            },
          },
          null,
          2,
        ),
      });

      proxy.pathJoin.returns({
        paths: [context.targetProjectRoot, '.mcp.json'],
        result: configPath,
      });
      proxy.fsReadFile.returns({ filepath: configPath, contents: existingConfig });
      proxy.fsWriteFile.succeeds({ filepath: configPath, contents: expectedMergedConfig });

      const result = await StartInstall({ context });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'merged',
        message: 'Merged dungeonmaster into existing .mcp.json',
      });
    });
  });
});
