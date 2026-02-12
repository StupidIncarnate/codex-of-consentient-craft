/**
 * PURPOSE: Wraps @testing-library/react act for synchronous state updates in binding tests
 *
 * USAGE:
 * testingLibraryActAdapter({callback: () => result.current.handleClick()});
 * // Wraps callback in React act() for state flush
 */
import { act } from '@testing-library/react';

export const testingLibraryActAdapter = ({ callback }: { callback: () => void }): void => {
  act(() => {
    callback();
  });
};
