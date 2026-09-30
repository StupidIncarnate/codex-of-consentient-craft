import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { orchestrationDispatchGetResponseDataContract } from './orchestration-dispatch-get-response-data-contract';
import type { OrchestrationDispatchGetResponseData } from './orchestration-dispatch-get-response-data-contract';

export const OrchestrationDispatchGetResponseDataStub = ({
  ...props
}: StubArgument<OrchestrationDispatchGetResponseData> = {}): OrchestrationDispatchGetResponseData =>
  orchestrationDispatchGetResponseDataContract.parse({
    state: DispatchStateStub(),
    ...props,
  });
