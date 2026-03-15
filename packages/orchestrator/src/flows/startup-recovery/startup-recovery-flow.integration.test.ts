import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { StartupRecoveryFlow } from './startup-recovery-flow';

describe('StartupRecoveryFlow', () => {
  describe('export', () => {
    it('VALID: StartupRecoveryFlow => exports an async function', () => {
      expect(typeof StartupRecoveryFlow).toBe('function');
    });
  });

  describe('recovery with no guilds', () => {
    it('VALID: {no configured guilds} => returns empty array', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-recovery' }),
      });

      process.env.DUNGEONMASTER_HOME = testbed.guildPath;

      const dungeonmasterDir = join(testbed.guildPath, '.dungeonmaster');
      mkdirSync(dungeonmasterDir, { recursive: true });
      writeFileSync(join(dungeonmasterDir, 'config.json'), JSON.stringify({ guilds: [] }));

      const result = await StartupRecoveryFlow();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual([]);
    });
  });
});
