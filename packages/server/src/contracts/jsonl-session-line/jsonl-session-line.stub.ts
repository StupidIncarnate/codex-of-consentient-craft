import type { StubArgument } from '@dungeonmaster/shared/@types';
import { jsonlSessionLineContract } from './jsonl-session-line-contract';
import type { JsonlSessionLine } from './jsonl-session-line-contract';

export const JsonlSessionLineStub = ({
  ...props
}: StubArgument<JsonlSessionLine> = {}): JsonlSessionLine =>
  jsonlSessionLineContract.parse({ ...props });
