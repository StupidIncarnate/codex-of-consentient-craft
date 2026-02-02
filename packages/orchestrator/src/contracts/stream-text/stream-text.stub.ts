import { streamTextContract } from './stream-text-contract';
import type { StreamText } from './stream-text-contract';

export const StreamTextStub = (
  { value }: { value: string } = { value: 'Hello from Claude' },
): StreamText => streamTextContract.parse(value);
