import { parsedToolInputContract } from './parsed-tool-input-contract';
import type { ParsedToolInput } from './parsed-tool-input-contract';

export const ParsedToolInputStub = (
  { value }: { value: Record<string, unknown> } = { value: { command: 'ls' } },
): ParsedToolInput => parsedToolInputContract.parse(value);
