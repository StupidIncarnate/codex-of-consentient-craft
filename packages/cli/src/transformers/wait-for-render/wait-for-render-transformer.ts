/**
 * PURPOSE: Creates a promise that resolves after the testing delay to allow React effects to run
 *
 * USAGE:
 * await waitForRenderTransformer();
 * // Waits for useEffect delay before continuing
 */
import { cliStatics } from '../../statics/cli/cli-statics';

export const waitForRenderTransformer = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};
