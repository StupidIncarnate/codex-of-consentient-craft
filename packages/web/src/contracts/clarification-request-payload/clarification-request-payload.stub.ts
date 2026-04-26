import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { clarificationRequestPayloadContract } from './clarification-request-payload-contract';
import type { ClarificationRequestPayload } from './clarification-request-payload-contract';

export const ClarificationRequestPayloadStub = ({
  ...props
}: StubArgument<ClarificationRequestPayload> = {}): ClarificationRequestPayload =>
  clarificationRequestPayloadContract.parse({
    chatProcessId: ProcessIdStub(),
    questions: [],
    ...props,
  });
