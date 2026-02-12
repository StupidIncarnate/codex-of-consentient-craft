/**
 * PURPOSE: Wraps @testing-library/react renderHook for testing React hooks in bindings
 *
 * USAGE:
 * const {result} = testingLibraryRenderHookAdapter({renderCallback: () => useMyBinding()});
 * // Returns RenderHookResult from @testing-library/react
 */
import type { RenderHookResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

export const testingLibraryRenderHookAdapter = <TResult>({
  renderCallback,
}: {
  renderCallback: () => TResult;
}): RenderHookResult<TResult, undefined> => renderHook(renderCallback);
