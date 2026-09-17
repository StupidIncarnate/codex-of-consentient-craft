import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgyPreToolHookData } from './agy-pre-tool-hook-data-contract';
import { agyPreToolHookDataContract } from './agy-pre-tool-hook-data-contract';

export const AgyPreToolHookDataStub = ({
  ...props
}: StubArgument<AgyPreToolHookData> = {}): AgyPreToolHookData =>
  agyPreToolHookDataContract.parse({
    toolCall: {
      name: 'run_command',
      args: {
        CommandLine: 'npm test',
      },
    },
    ...props,
  });
