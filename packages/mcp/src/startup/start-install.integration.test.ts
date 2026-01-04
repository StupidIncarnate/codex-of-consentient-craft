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
        message: 'Created .mcp.json with dungeonmaster config',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"dungeonmaster"/u);
      expect(configContent).toMatch(/"type": "stdio"/u);
      expect(configContent).toMatch(/@dungeonmaster\/mcp/u);
    });

    it('VALID: {context: config exists with dungeonmaster} => skips installation', async () => {
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

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'skipped',
        message: 'MCP config already exists',
      });
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
        message: 'Merged dungeonmaster into existing .mcp.json',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"other"/u);
      expect(configContent).toMatch(/"dungeonmaster"/u);
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
        message: 'Created .mcp.json with dungeonmaster config',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      testbed.cleanup();

      expect(configContent).toMatch(/"dungeonmaster"/u);
    });
  });
});
