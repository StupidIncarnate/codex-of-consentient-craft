import { wardRunnerHarness } from '../../test/harnesses/ward-runner/ward-runner.harness';

import { StartWard } from './start-ward';

const MAX_RSS_KB = 307_200;

describe('StartWard', () => {
  const harness = wardRunnerHarness();

  describe('delegation to ward flow', () => {
    it('VALID: {args: ["node", "ward", "unknown-command"]} => completes without throwing for unknown command', async () => {
      await expect(
        StartWard({ args: ['node', 'ward', 'unknown-command'] }),
      ).resolves.toBeUndefined();
    });
  });

  describe('memory ceiling', () => {
    it('SAFETY: {--only lint, all packages} => RSS stays under 300MB', async () => {
      expect(harness.wardBinExists()).toBe(true);

      const { maxRssKb } = await harness.runAndMonitorMemory({
        args: ['run', '--only', 'lint'],
      });

      expect(maxRssKb).toBeLessThan(MAX_RSS_KB);
    }, 60_000); // TIMEBOUND: runAndMonitorMemory spawns ward process with 30s timeout + polling
  });
});
