import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { npmCommandFakeHarness } from '../../../test/harnesses/npm-command-fake/npm-command-fake.harness';
import { InstallFlow } from '../install/install-flow';
import { InstallFinalizeFlow } from './install-finalize-flow';

describe('InstallFinalizeFlow', () => {
  const npmFake = npmCommandFakeHarness();

  describe('nothing scaffolded this run', () => {
    // Runs first in this file, relying on recipesScaffoldState starting empty — the other test
    // below drains what it marks before finishing, so this stays true whichever test runs next.
    it('VALID: {InstallFlow never ran this process} => skipped, no npm command runs', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'install-finalize-flow-noop' }),
      });

      const result = await InstallFinalizeFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
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
        baseName: BaseNameStub({ value: 'install-finalize-flow-scaffolded' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      const result = await InstallFinalizeFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
      });
    });
  });
});
