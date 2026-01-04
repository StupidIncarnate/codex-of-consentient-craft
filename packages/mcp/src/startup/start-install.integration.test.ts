import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => creates .mcp.json with dungeonmaster config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-mcp-config' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"dungeonmaster"/u);
      expect(configContent).toMatch(/"type": "stdio"/u);
      expect(configContent).toMatch(/@dungeonmaster\/mcp/u);
      expect(settingsContent).toMatch(/mcp__dungeonmaster__get-architecture/u);
    });

    it('VALID: {context: config exists with dungeonmaster} => skips mcp.json but still adds permissions', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-mcp-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
        content: FileContentStub({
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

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'skipped',
        message: 'MCP config already exists, added permissions',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(settingsContent).toMatch(/mcp__dungeonmaster__get-architecture/u);
    });

    it('VALID: {context: config exists without dungeonmaster} => merges dungeonmaster config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'merge-mcp-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
        content: FileContentStub({
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

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'merged',
        message: 'Merged dungeonmaster into existing .mcp.json and added permissions',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"other"/u);
      expect(configContent).toMatch(/"dungeonmaster"/u);
      expect(settingsContent).toMatch(/mcp__dungeonmaster__get-architecture/u);
    });

    it('VALID: {context: config exists with invalid JSON} => creates new config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'invalid-mcp-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
        content: FileContentStub({
          value: 'invalid json{',
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"dungeonmaster"/u);
      expect(settingsContent).toMatch(/mcp__dungeonmaster__get-architecture/u);
    });
  });
});
