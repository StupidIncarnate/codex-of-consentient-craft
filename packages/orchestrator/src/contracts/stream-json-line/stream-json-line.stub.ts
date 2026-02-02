import { streamJsonLineContract } from './stream-json-line-contract';
import type { StreamJsonLine } from './stream-json-line-contract';

export const StreamJsonLineStub = (
  { value }: { value: string } = { value: '{"type":"init","session_id":"abc-123"}' },
): StreamJsonLine => streamJsonLineContract.parse(value);
