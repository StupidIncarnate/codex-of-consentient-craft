import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts/ask-user-question/ask-user-question.stub';

import { clarificationRequestPayloadContract } from './clarification-request-payload-contract';
import type { ClarificationRequestPayload } from './clarification-request-payload-contract';

export const ClarificationRequestPayloadStub = ({
  ...props
}: StubArgument<ClarificationRequestPayload> = {}): ClarificationRequestPayload =>
  clarificationRequestPayloadContract.parse({
    chatProcessId: 'proc-12345',
    questions: AskUserQuestionStub().questions,
    ...props,
  });
