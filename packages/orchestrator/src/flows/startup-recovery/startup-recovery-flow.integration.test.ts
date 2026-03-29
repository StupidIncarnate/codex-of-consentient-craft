import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { StartupRecoveryFlow } from './startup-recovery-flow';

describe('StartupRecoveryFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: StartupRecoveryFlow => exports an async function', () => {
      expect(StartupRecoveryFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('recovery with no guilds', () => {
    it('VALID: {no configured guilds} => returns empty array', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-recovery' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartupRecoveryFlow();

      testbed.cleanup();
      restore();

      expect(result).toStrictEqual([]);
    });
  });
});
