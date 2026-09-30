import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { mcpServerStatics } from '../statics/mcp-server/mcp-server-statics';
import { StartInstall } from './start-install';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => delegates to install flow and creates config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-install-wiring',
      });

      const result = await StartInstall({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const configContent = testbed.readFile({
        relativePath: '.mcp.json',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/mcp',
        success: true,
        action: 'created',
        message: 'Created .mcp.json with dungeonmaster config and added permissions',
      });
      // String-exact: proves the real on-disk write ends in one trailing newline.
      expect(configContent).toBe(
        `${JSON.stringify(
          {
            mcpServers: {
              dungeonmaster: {
                type: 'stdio',
                command: 'node',
                args: ['-e', mcpServerStatics.resolveScript],
              },
            },
          },
          null,
          2,
        )}\n`,
      );
    });
  });
});
