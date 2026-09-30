import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { orchestrationDispatchPlayResponseDataContract } from './orchestration-dispatch-play-response-data-contract';
import type { OrchestrationDispatchPlayResponseData } from './orchestration-dispatch-play-response-data-contract';

export const OrchestrationDispatchPlayResponseDataStub = ({
  ...props
}: StubArgument<OrchestrationDispatchPlayResponseData> = {}): OrchestrationDispatchPlayResponseData =>
  orchestrationDispatchPlayResponseDataContract.parse({
    state: DispatchStateStub(),
    ...props,
  });
