/**
 * PURPOSE: Wraps @testing-library/react act for synchronous state updates in binding tests
 *
 * USAGE:
 * testingLibraryActAdapter({callback: () => result.current.handleClick()});
 * // Wraps callback in React act() for state flush
 */
import { act } from '@testing-library/react';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const testingLibraryActAdapter = ({ callback }: { callback: () => void }): AdapterResult => {
  act(() => {
    callback();
  });

  return { success: true as const };
};
