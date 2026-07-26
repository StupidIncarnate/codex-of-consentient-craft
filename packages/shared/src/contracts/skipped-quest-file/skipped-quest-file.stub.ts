import type { StubArgument } from '@dungeonmaster/shared/@types';

import { skippedQuestFileContract } from './skipped-quest-file-contract';
import type { SkippedQuestFile } from './skipped-quest-file-contract';

export const SkippedQuestFileStub = ({
  ...props
}: StubArgument<SkippedQuestFile> = {}): SkippedQuestFile =>
  skippedQuestFileContract.parse({
    questFolder: '4226b8d1-2827-4250-8d82-c278d66bcd2d',
    questFilePath:
      '/home/user/.dungeonmaster/guilds/g1/quests/4226b8d1-2827-4250-8d82-c278d66bcd2d/quest.json',
    reason: "workItems.1.role: Invalid enum value, received 'pathseeker'",
    ...props,
  });
