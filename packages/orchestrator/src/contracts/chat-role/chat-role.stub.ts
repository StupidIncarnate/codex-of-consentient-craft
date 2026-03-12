import { chatRoleContract } from './chat-role-contract';
import type { ChatRole } from './chat-role-contract';

export const ChatRoleStub = (
  { value }: { value: string } = { value: 'chaoswhisperer' },
): ChatRole => chatRoleContract.parse(value);
