import { parsedToolResultContract } from './parsed-tool-result-contract';
import type { ParsedToolResult } from './parsed-tool-result-contract';

export const ParsedToolResultStub = (
  { value }: { value: Record<string, unknown> } = { value: { name: 'codeweaver' } },
): ParsedToolResult => parsedToolResultContract.parse(value);
