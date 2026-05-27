/**
 * PURPOSE: Proxy for orchestrator-create-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorCreateQuestAdapterProxy();
 * proxy.returns({ questId, guildSlug });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { QuestIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;

export const orchestratorCreateQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; guildSlug: UrlSlug }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.createQuestForMcp });

  handle.mockResolvedValue({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    guildSlug: UrlSlugStub({ value: 'default-guild' }),
  });

  return {
    returns: ({ questId, guildSlug }: { questId: QuestId; guildSlug: UrlSlug }): void => {
      handle.mockResolvedValueOnce({ questId, guildSlug });
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
