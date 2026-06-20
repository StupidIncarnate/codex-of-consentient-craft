import type { SubagentStopHookData } from './subagent-stop-hook-data-contract';
import { subagentStopHookDataContract } from './subagent-stop-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SubagentStopHookDataStub = ({
  ...props
}: StubArgument<SubagentStopHookData> = {}): SubagentStopHookData =>
  subagentStopHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/tmp/stub-cwd',
    hook_event_name: 'SubagentStop',
    ...props,
  });
