import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationResultContract } from './orchestration-result-contract';
import type { OrchestrationResult } from './orchestration-result-contract';

export const OrchestrationResultStub = ({
  ...props
}: StubArgument<OrchestrationResult> = {}): OrchestrationResult =>
  orchestrationResultContract.parse({
    type: 'all_complete',
    ...props,
  });
