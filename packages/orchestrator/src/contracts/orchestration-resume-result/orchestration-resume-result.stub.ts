/**
 * PURPOSE: Builds a valid OrchestrationResumeResult for tests
 *
 * USAGE:
 * OrchestrationResumeResultStub();
 * // Returns a valid OrchestrationResumeResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStatusStub } from '@dungeonmaster/shared/contracts/quest-status/quest-status.stub';

import { orchestrationResumeResultContract } from './orchestration-resume-result-contract';
import type { OrchestrationResumeResult } from './orchestration-resume-result-contract';

export const OrchestrationResumeResultStub = ({
  ...props
}: StubArgument<OrchestrationResumeResult> = {}): OrchestrationResumeResult =>
  orchestrationResumeResultContract.parse({
    resumed: false,
    restoredStatus: QuestStatusStub(),
    ...props,
  });
