import { cliStatics } from '../../statics/cli/cli-statics';

import { waitForRenderTransformer } from './wait-for-render-transformer';

describe('waitForRenderTransformer', () => {
  describe('delay behavior', () => {
    it('VALID: {} => resolves after useEffectDelayMs', async () => {
      const startTime = Date.now();

      await waitForRenderTransformer();

      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeGreaterThanOrEqual(cliStatics.testing.useEffectDelayMs - 1);
    });

    it('VALID: {} => completes without error', async () => {
      await waitForRenderTransformer();

      // If we reach here, the transformer resolved successfully
      expect(true).toBe(true);
    });
  });
});
