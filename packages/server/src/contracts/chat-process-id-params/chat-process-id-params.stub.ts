import type { StubArgument } from '@dungeonmaster/shared/@types';
import { chatProcessIdParamsContract } from './chat-process-id-params-contract';
import type { ChatProcessIdParams } from './chat-process-id-params-contract';

export const ChatProcessIdParamsStub = ({
  ...props
}: StubArgument<ChatProcessIdParams> = {}): ChatProcessIdParams =>
  chatProcessIdParamsContract.parse({
    chatProcessId: 'proc-12345',
    ...props,
  });
