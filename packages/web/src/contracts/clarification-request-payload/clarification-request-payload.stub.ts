import type { StubArgument } from '@dungeonmaster/shared/@types';

import { clarificationRequestPayloadContract } from './clarification-request-payload-contract';
import type { ClarificationRequestPayload } from './clarification-request-payload-contract';

export const ClarificationRequestPayloadStub = ({
  ...props
}: StubArgument<ClarificationRequestPayload> = {}): ClarificationRequestPayload =>
  clarificationRequestPayloadContract.parse({
    chatProcessId: 'proc-12345',
    questions: [],
    ...props,
  });
