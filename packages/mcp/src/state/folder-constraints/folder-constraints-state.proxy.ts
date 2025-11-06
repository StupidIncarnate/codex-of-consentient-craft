/**
 * PURPOSE: Test setup helper for folder constraints state
 *
 * USAGE:
 * const proxy = folderConstraintsStateProxy();
 * proxy.setupClear();
 * // State is cleared for test isolation
 */
import { folderConstraintsState } from './folder-constraints-state';

export const folderConstraintsStateProxy = (): {
  setupClear: () => void;
} => {
  return {
    setupClear: (): void => {
      folderConstraintsState.clear();
    },
  };
};
