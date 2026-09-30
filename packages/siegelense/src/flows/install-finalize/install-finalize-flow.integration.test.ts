import { deleteEnv, setEnv } from '#gateway/node/process';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { npmCommandFakeHarness } from '../../../test/harnesses/npm-command-fake/npm-command-fake.harness';
import { InstallFlow } from '../install/install-flow';
import { InstallFinalizeFlow } from './install-finalize-flow';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallFinalizeFlow', () => {
  const npmFake = npmCommandFakeHarness();

  describe('nothing scaffolded this run', () => {
    // Runs first in this file, relying on recipesScaffoldState starting empty — the other test
    // below drains what it marks before finishing, so this stays true whichever test runs next.
    it('VALID: {InstallFlow never ran this process} => skipped, no npm command runs', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'install-finalize-flow-noop',
      });

      const result = await InstallFinalizeFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: `${testbed.guildPath}/.wrong-cli-root`,
          },
        }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'no freshly scaffolded packages/hydration-recipes/ this run',
      });
    });
  });

  describe('a fresh scaffold this run', () => {
    it('VALID: {InstallFlow scaffolded packages/hydration-recipes/, then InstallFinalizeFlow runs} => reports the finished build', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({
        baseName: 'install-finalize-flow-scaffolded',
      });

      // The scaffold scopes its package off the root package.json's `name`, so the testbed names
      // it — otherwise the scope falls back to the testbed directory's randomised basename.
      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'acme-app' }),
      });
      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      setEnv('DUNGEONMASTER_HOME', dungeonmasterHomePath);

      await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: `${testbed.guildPath}/.wrong-cli-root`,
          },
        }),
      });

      const result = await InstallFinalizeFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: `${testbed.guildPath}/.wrong-cli-root`,
          },
        }),
      });

      deleteEnv('DUNGEONMASTER_HOME');
      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'npm run build --workspace=@acme-app/hydration-recipes finished for packages/hydration-recipes/',
      });
    });
  });
});
