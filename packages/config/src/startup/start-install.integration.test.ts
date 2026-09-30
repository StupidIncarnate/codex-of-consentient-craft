import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { StartInstall } from './start-install';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => delegates to flow and creates config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'startup-delegate',
      });

      const result = await StartInstall({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });

      const configContent = testbed.readFile({
        relativePath: '.dungeonmaster.json',
      });

      testbed.cleanup();

      expect({ success: result.success, action: result.action }).toStrictEqual({
        success: true,
        action: 'created',
      });
      // String-exact: proves the real on-disk write ends in one trailing newline.
      expect(configContent).toBe(
        `${JSON.stringify(
          {
            framework: 'monorepo',
            orchestrationMode: 'node',
            schema: 'zod',
            orchestration: { slotCount: 3, timeoutMs: 900000 },
            dungeonmaster: { port: 3737 },
            devServer: {
              devCommand: 'npm run dev',
              port: 3738,
              buildCommand: 'npm run build',
              readinessPath: '/',
              readinessTimeoutMs: 30000,
              e2e: {
                processes: [
                  {
                    name: 'app',
                    command: 'npm run dev:no-watch',
                    portRole: 'api',
                    readyPath: '/',
                    env: { PORT: '{apiPort}' },
                  },
                ],
              },
            },
            gateway: {},
          },
          null,
          2,
        )}\n`,
      );
    });
  });
});
