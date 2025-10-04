import type { SessionStartHookData } from './session-start-hook-data';

export const SessionStartHookStub = (
  overrides: Partial<SessionStartHookData> = {},
): SessionStartHookData => ({
  session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  transcript_path: '/tmp/transcript.jsonl',
  cwd: process.cwd(),
  hook_event_name: 'SessionStart',
  ...overrides,
});
