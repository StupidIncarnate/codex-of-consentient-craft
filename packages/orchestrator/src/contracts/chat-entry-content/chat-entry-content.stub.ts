import { chatEntryContentContract } from './chat-entry-content-contract';

type ChatEntryContent = ReturnType<typeof chatEntryContentContract.parse>;

export const ChatEntryContentStub = ({ value }: { value?: string } = {}): ChatEntryContent =>
  chatEntryContentContract.parse(value ?? 'You are an AI assistant.');
