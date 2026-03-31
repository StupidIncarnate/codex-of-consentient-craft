import type { SubagentStartHookData } from './subagent-start-hook-data-contract';
import { subagentStartHookDataContract } from './subagent-start-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SubagentStartHookDataStub = ({
  ...props
}: StubArgument<SubagentStartHookData> = {}): SubagentStartHookData =>
  subagentStartHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'SubagentStart',
    agent_id: 'agent-abc123',
    agent_type: 'Explore',
    ...props,
  });
