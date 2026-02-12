/**
 * PURPOSE: Wraps @testing-library/react act for async state updates in binding tests
 *
 * USAGE:
 * await testingLibraryActAsyncAdapter({callback: async () => result.current.startExecution({questId})});
 * // Wraps async callback in React act() to flush all pending state updates
 */
import { act } from '@testing-library/react';

export const testingLibraryActAsyncAdapter = async ({
  callback,
}: {
  callback: () => Promise<void>;
}): Promise<void> => {
  await act(async () => {
    await callback();
  });
};
