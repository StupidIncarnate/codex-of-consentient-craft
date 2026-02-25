import { chatLineSourceContract } from './chat-line-source-contract';
import type { ChatLineSource } from './chat-line-source-contract';

export const ChatLineSourceStub = (
  { value }: { value: string } = { value: 'session' },
): ChatLineSource => chatLineSourceContract.parse(value);
