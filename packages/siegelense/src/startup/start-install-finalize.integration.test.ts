import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { StartInstallFinalize } from './start-install-finalize';

describe('StartInstallFinalize', () => {
  describe('wiring to install finalize flow', () => {
    it('VALID: {nothing scaffolded this process} => delegates to the flow and returns its skipped result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-install-finalize-wiring' }),
      });

      const result = await StartInstallFinalize({
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
});
