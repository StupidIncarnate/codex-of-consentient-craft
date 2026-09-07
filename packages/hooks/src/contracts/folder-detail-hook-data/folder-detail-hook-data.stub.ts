import type { FolderDetailHookData } from './folder-detail-hook-data-contract';
import { folderDetailHookDataContract } from './folder-detail-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const FolderDetailHookDataStub = ({
  ...props
}: StubArgument<FolderDetailHookData> = {}): FolderDetailHookData =>
  folderDetailHookDataContract.parse({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/test/file.ts' },
    transcript_path: '/tmp/transcript.jsonl',
    ...props,
  });
