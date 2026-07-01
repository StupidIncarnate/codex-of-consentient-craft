import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatLineProcessorContract } from './chat-line-processor-contract';
import type { ChatLineProcessor } from './chat-line-processor-contract';

export const ChatLineProcessorStub = ({
  ...props
}: StubArgument<ChatLineProcessor> = {}): ChatLineProcessor => {
  const processLine = props.processLine ?? jest.fn().mockReturnValue([]);
  const resolveToolUseIdForAgent =
    props.resolveToolUseIdForAgent ?? jest.fn().mockReturnValue(undefined);
  const registerAgentTranslation = props.registerAgentTranslation ?? jest.fn();
  const registerParentChain = props.registerParentChain ?? jest.fn();
  const resolveParentRealAgentId =
    props.resolveParentRealAgentId ?? jest.fn().mockReturnValue(undefined);
  const pairSubagentByPrompt = props.pairSubagentByPrompt ?? jest.fn().mockReturnValue(false);

  const validated = chatLineProcessorContract.parse({ processLine });

  return {
    processLine: validated.processLine as ChatLineProcessor['processLine'],
    resolveToolUseIdForAgent:
      resolveToolUseIdForAgent as ChatLineProcessor['resolveToolUseIdForAgent'],
    registerAgentTranslation:
      registerAgentTranslation as ChatLineProcessor['registerAgentTranslation'],
    registerParentChain: registerParentChain as ChatLineProcessor['registerParentChain'],
    resolveParentRealAgentId:
      resolveParentRealAgentId as ChatLineProcessor['resolveParentRealAgentId'],
    pairSubagentByPrompt: pairSubagentByPrompt as ChatLineProcessor['pairSubagentByPrompt'],
  };
};
