import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => delegates to install flow and creates config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-install-wiring' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.mcp.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });
      expect(configContent).toBe(
        JSON.stringify(
          {
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'node',
                args: ['node_modules/@dungeonmaster/mcp/dist/src/index.js'],
              },
            },
          },
          null,
          2,
        ),
      );
    });
  });
});
