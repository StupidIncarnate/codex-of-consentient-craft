import type { HookBackgroundTask } from './hook-background-task-contract';
import { hookBackgroundTaskContract } from './hook-background-task-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const HookBackgroundTaskStub = ({
  ...props
}: StubArgument<HookBackgroundTask> = {}): HookBackgroundTask =>
  hookBackgroundTaskContract.parse({
    id: 'bcibjy15w',
    type: 'shell',
    status: 'running',
    description: 'Run full ward in background',
    command: 'npm run ward',
    ...props,
  });
