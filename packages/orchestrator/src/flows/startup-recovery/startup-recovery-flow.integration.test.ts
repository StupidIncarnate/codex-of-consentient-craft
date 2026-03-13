import { StartupRecoveryFlow } from './startup-recovery-flow';

describe('StartupRecoveryFlow', () => {
  describe('export', () => {
    it('VALID: StartupRecoveryFlow => exports an async function', () => {
      expect(typeof StartupRecoveryFlow).toBe('function');
    });
  });

  describe('recovery with no guilds', () => {
    it('VALID: {no configured guilds} => returns empty array', async () => {
      const result = await StartupRecoveryFlow();

      expect(result).toStrictEqual([]);
    });
  });
});
