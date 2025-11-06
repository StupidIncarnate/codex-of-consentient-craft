import type { PostToolUseHookData } from './post-tool-use-hook-data-contract';
import { postToolUseHookDataContract } from './post-tool-use-hook-data-contract';
import { writeToolInputContract } from '../write-tool-input/write-tool-input-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const PostToolUseHookStub = ({
  ...props
}: StubArgument<PostToolUseHookData> = {}): PostToolUseHookData =>
  postToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: writeToolInputContract.parse({
      file_path: '/test/file.ts',
      content: '',
    }),
    ...props,
  });
