import type { SessionStartHookData } from './session-start-hook-data-contract';
import { sessionStartHookDataContract } from './session-start-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SessionStartHookStub = ({
  ...props
}: StubArgument<SessionStartHookData> = {}): SessionStartHookData =>
  sessionStartHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'SessionStart',
    ...props,
  });
