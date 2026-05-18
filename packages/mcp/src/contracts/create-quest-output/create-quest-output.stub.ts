import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { createQuestOutputContract } from './create-quest-output-contract';
import type { CreateQuestOutput } from './create-quest-output-contract';

export const CreateQuestOutputStub = ({
  ...props
}: StubArgument<CreateQuestOutput> = {}): CreateQuestOutput =>
  createQuestOutputContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    guildSlug: UrlSlugStub({ value: 'my-guild' }),
    ...props,
  });
