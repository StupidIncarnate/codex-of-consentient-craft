import type { StubArgument } from '@dungeonmaster/shared/@types';

import { transcriptReadContract } from './transcript-read-contract';
import type { TranscriptRead } from './transcript-read-contract';

export const TranscriptReadStub = ({
  ...props
}: StubArgument<TranscriptRead> = {}): TranscriptRead =>
  transcriptReadContract.parse({
    path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
    fromByte: 0,
    ...props,
  });
