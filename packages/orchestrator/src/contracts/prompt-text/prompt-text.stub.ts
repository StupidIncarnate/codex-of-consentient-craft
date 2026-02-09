import { promptTextContract } from './prompt-text-contract';

type PromptText = ReturnType<typeof promptTextContract.parse>;

export const PromptTextStub = ({ value }: { value?: string } = {}): PromptText =>
  promptTextContract.parse(value ?? 'You are an AI assistant.');
