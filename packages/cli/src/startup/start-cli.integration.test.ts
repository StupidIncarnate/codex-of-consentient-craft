import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { npmCommandFakeHarness } from '../../test/harnesses/npm-command-fake/npm-command-fake.harness';
import { StartCli } from './start-cli';

describe('StartCli', () => {
  describe('delegation to CLI flow', () => {
    const npmFake = npmCommandFakeHarness();

    // `init` routes through every discovered package's real `dist/startup/start-install.js`,
    // `@dungeonmaster/siegelense`'s included — which scaffolds a fresh `packages/hydration-recipes`
    // and then really runs `npm install` / `npm run build --workspace=...` against it (DEF-36). The
    // fake keeps this test on the fs-write behaviour StartCli itself is responsible for, the same
    // way `packages/siegelense/src/flows/install/install-flow.integration.test.ts` fakes it for
    // siegelense's own install-flow test.
    it('VALID: {command: "init"} => delegates to CliFlow which runs init responder', async () => {
      npmFake.stageSucceeds();
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-cli-init' }),
      });

      await StartCli({
        command: 'init',
        args: [],
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
    });
  });
});
