import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { orchestrationDispatchPauseResponseDataContract } from './orchestration-dispatch-pause-response-data-contract';
import type { OrchestrationDispatchPauseResponseData } from './orchestration-dispatch-pause-response-data-contract';

export const OrchestrationDispatchPauseResponseDataStub = ({
  ...props
}: StubArgument<OrchestrationDispatchPauseResponseData> = {}): OrchestrationDispatchPauseResponseData =>
  orchestrationDispatchPauseResponseDataContract.parse({
    state: DispatchStateStub(),
    ...props,
  });
