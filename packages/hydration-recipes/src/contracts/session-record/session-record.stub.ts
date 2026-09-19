/**
 * PURPOSE: Builds a valid `SessionRecord` for a test that needs one but does not care which id,
 * directory or file it names.
 *
 * USAGE:
 * SessionRecordStub({ sessionId: 'seed-session-1' });
 * // Returns SessionRecord
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sessionRecordContract } from './session-record-contract';
import type { SessionRecord } from './session-record-contract';

export const SessionRecordStub = ({ ...props }: StubArgument<SessionRecord> = {}): SessionRecord =>
  sessionRecordContract.parse({
    sessionId: 'seed-session-1',
    cwd: '/tmp/session-record-stub/guild-1',
    filePath:
      '/tmp/session-record-stub/guild-1/.claude/projects/-tmp-session-record-stub-guild-1/seed-session-1.jsonl',
    lineCount: 1,
    ...props,
  });
