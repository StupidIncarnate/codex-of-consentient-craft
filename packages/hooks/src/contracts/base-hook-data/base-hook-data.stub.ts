import type { BaseHookData } from './base-hook-data-contract';
import { baseHookDataContract } from './base-hook-data-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const BaseHookDataStub = ({ ...props }: StubArgument<BaseHookData> = {}): BaseHookData =>
  baseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    ...props,
  });
