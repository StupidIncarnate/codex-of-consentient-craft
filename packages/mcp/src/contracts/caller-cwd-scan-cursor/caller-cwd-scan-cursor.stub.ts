import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { callerCwdScanCursorContract } from './caller-cwd-scan-cursor-contract';
import type { CallerCwdScanCursor } from './caller-cwd-scan-cursor-contract';

export const CallerCwdScanCursorStub = ({
  ...props
}: StubArgument<CallerCwdScanCursor> = {}): CallerCwdScanCursor =>
  callerCwdScanCursorContract.parse({
    filepath: AbsoluteFilePathStub({ value: '/home/tester/.claude/projects/-x/session.jsonl' }),
    offsetBytes: 0,
    ...props,
  });
