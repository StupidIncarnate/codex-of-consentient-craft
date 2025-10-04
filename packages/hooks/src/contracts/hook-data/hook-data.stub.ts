import type { HookData } from './hook-data-contract';
import { hookDataContract } from './hook-data-contract';

export const HookDataStub = (overrides: Partial<HookData> = {}): HookData => {
  const base = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/test/file.ts',
      content: '',
    },
  };
  return hookDataContract.parse({ ...base, ...overrides });
};
