/**
 * PURPOSE: Builds a valid OrchestrationModeGetResult for tests, defaulting to `claude`.
 *
 * USAGE:
 * OrchestrationModeGetResultStub();
 * // Returns { mode: 'claude' }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';

import { orchestrationModeGetResultContract } from './orchestration-mode-get-result-contract';
import type { OrchestrationModeGetResult } from './orchestration-mode-get-result-contract';

export const OrchestrationModeGetResultStub = ({
  ...props
}: StubArgument<OrchestrationModeGetResult> = {}): OrchestrationModeGetResult =>
  orchestrationModeGetResultContract.parse({
    mode: OrchestrationModeStub(),
    ...props,
  });
