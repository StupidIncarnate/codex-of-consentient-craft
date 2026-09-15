/**
 * PURPOSE: Starting point startup entry delegating to the flow — replace with real bootstrapping
 * as the package grows.
 *
 * USAGE:
 * await StartSiegelense.run({ input: 'example' });
 */

import { SiegelenseFlow } from '../flows/siegelense/siegelense-flow';

export const StartSiegelense = {
  run: async ({ input }: { input: string }): Promise<void> => {
    await SiegelenseFlow({ input });
  },
};
