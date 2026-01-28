/**
 * PURPOSE: Transforms debug session state into a DebugResponse contract object
 *
 * USAGE:
 * buildDebugResponseTransformer({
 *   success: true,
 *   frame: '> Menu',
 *   currentScreen: 'menu',
 *   invocations,
 * });
 * // Returns validated DebugResponse
 */
import type { BuildDebugResponseParams } from '../../contracts/build-debug-response-params/build-debug-response-params-contract';
import type { DebugResponse } from '../../contracts/debug-response/debug-response-contract';
import { debugResponseContract } from '../../contracts/debug-response/debug-response-contract';
import { screenNameContract } from '../../contracts/screen-name/screen-name-contract';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import { frameToElementsTransformer } from '../frame-to-elements/frame-to-elements-transformer';
import { buildCallbacksRecordTransformer } from '../build-callbacks-record/build-callbacks-record-transformer';

export const buildDebugResponseTransformer = ({
  success,
  error,
  frame,
  currentScreen,
  invocations,
}: BuildDebugResponseParams): DebugResponse => {
  const elements = frameToElementsTransformer({ frame });
  const screenName = screenNameContract.parse(currentScreen);
  const callbacks = buildCallbacksRecordTransformer({ invocations });

  return debugResponseContract.parse({
    success,
    screen: {
      name: screenName,
      frame,
      elements,
    },
    callbacks,
    error: error === undefined ? undefined : errorMessageContract.parse(error),
  });
};
