import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgyTranscriptLine } from './agy-transcript-line-contract';
import { agyTranscriptLineContract } from './agy-transcript-line-contract';

export const AgyTranscriptLineStub = ({
  ...props
}: StubArgument<AgyTranscriptLine> = {}): AgyTranscriptLine =>
  agyTranscriptLineContract.parse({
    tool_calls: [
      {
        name: 'run_command',
        args: { CommandLine: 'git status' },
      },
    ],
    ...props,
  });
