import type { PreSearchHookData } from './pre-search-hook-data-contract';
import { preSearchHookDataContract } from './pre-search-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const PreSearchHookDataStub = ({
  ...props
}: StubArgument<PreSearchHookData> = {}): PreSearchHookData =>
  preSearchHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Grep',
    tool_input: { pattern: 'searchTerm', path: '/src' },
    ...props,
  });
