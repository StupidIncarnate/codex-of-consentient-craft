import type { UserPromptSubmitHookData } from './user-prompt-submit-hook-data-contract';
import { userPromptSubmitHookDataContract } from './user-prompt-submit-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const UserPromptSubmitHookDataStub = ({
  ...props
}: StubArgument<UserPromptSubmitHookData> = {}): UserPromptSubmitHookData =>
  userPromptSubmitHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'UserPromptSubmit',
    user_prompt: 'Test prompt',
    ...props,
  });
