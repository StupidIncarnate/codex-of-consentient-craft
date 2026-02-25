import { chatLineProcessorContract } from './chat-line-processor-contract';
import type { ChatLineProcessor } from './chat-line-processor-contract';

export const ChatLineProcessorStub = (): ChatLineProcessor => {
  const processLine = jest.fn().mockReturnValue([]);

  chatLineProcessorContract.parse({ processLine });

  return {
    processLine: processLine as ChatLineProcessor['processLine'],
  };
};
