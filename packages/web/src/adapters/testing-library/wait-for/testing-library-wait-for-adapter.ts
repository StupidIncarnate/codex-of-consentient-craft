/**
 * PURPOSE: Wraps @testing-library/react waitFor for async assertions in binding tests
 *
 * USAGE:
 * await testingLibraryWaitForAdapter({callback: () => expect(result.current.loading).toBe(false)});
 * // Waits until the callback stops throwing
 */
import { waitFor } from '@testing-library/react';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const testingLibraryWaitForAdapter = async ({
  callback,
}: {
  callback: () => void;
}): Promise<AdapterResult> => {
  await waitFor(callback);

  return { success: true as const };
};
