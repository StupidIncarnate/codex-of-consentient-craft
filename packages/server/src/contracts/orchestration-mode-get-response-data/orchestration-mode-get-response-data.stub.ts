import type { StubArgument } from '@dungeonmaster/shared/@types';
import { orchestrationModeGetResponseDataContract } from './orchestration-mode-get-response-data-contract';
import type { OrchestrationModeGetResponseData } from './orchestration-mode-get-response-data-contract';

export const OrchestrationModeGetResponseDataStub = ({
  ...props
}: StubArgument<OrchestrationModeGetResponseData> = {}): OrchestrationModeGetResponseData =>
  orchestrationModeGetResponseDataContract.parse({
    mode: 'node',
    ...props,
  });
