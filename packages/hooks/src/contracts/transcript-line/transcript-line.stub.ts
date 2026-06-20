import type { TranscriptLine } from './transcript-line-contract';
import { transcriptLineContract } from './transcript-line-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TranscriptLineStub = ({
  ...props
}: StubArgument<TranscriptLine> = {}): TranscriptLine =>
  transcriptLineContract.parse({
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_stub',
          name: 'mcp__dungeonmaster__signal-back',
          input: { questId: 'quest-1', workItemId: 'work-1', signal: 'complete' },
        },
      ],
    },
    ...props,
  });
