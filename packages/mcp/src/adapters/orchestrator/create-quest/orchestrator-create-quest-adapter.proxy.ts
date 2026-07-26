/**
 * PURPOSE: Proxy for orchestrator-create-quest-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorCreateQuestAdapterProxy();
 * proxy.returns({ userRequest: 'Build the login flow', questId, guildSlug });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;

export const orchestratorCreateQuestAdapterProxy = (): {
  returns: (params: { userRequest: string; questId: QuestId; guildSlug: UrlSlug }) => void;
  throws: (params: { userRequest: string; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.createQuestForMcp });

  return {
    returns: ({
      userRequest,
      questId,
      guildSlug,
    }: {
      userRequest: string;
      questId: QuestId;
      guildSlug: UrlSlug;
    }): void => {
      handle.calledWith([{ userRequest }]).resolves({ questId, guildSlug });
    },
    throws: ({ userRequest, error }: { userRequest: string; error: Error }): void => {
      handle.calledWith([{ userRequest }]).rejects(error);
    },
  };
};
