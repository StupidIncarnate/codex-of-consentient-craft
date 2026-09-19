import type { StubArgument } from '@dungeonmaster/shared/@types';

import { transcriptLineContract } from './transcript-line-contract';
import type { TranscriptLine } from './transcript-line-contract';

export const TranscriptLineStub = ({
  ...props
}: StubArgument<TranscriptLine> = {}): TranscriptLine =>
  transcriptLineContract.parse({
    uuid: 'a1b2c3d4-0000-4000-8000-000000000001-user',
    timestamp: '2026-01-01T00:00:00.000Z',
    message: { role: 'user', content: 'Seeded by the session-with-nested-subagent recipe.' },
    ...props,
  });
