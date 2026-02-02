/**
 * PURPOSE: Proxy for orchestratorLoadQuestAdapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorLoadQuestAdapterProxy();
 * proxy.returns({ quest });
 */
import * as orchestrator from '@dungeonmaster/orchestrator';
import type { Quest } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator', () => ({
  questLoadBroker: jest.fn(),
}));

const mockQuestLoadBroker = jest.mocked(orchestrator.questLoadBroker);

export const orchestratorLoadQuestAdapterProxy = (): {
  returns: (params: { quest: Quest }) => void;
  throws: (params: { error: Error }) => void;
} => ({
  returns: ({ quest }: { quest: Quest }): void => {
    mockQuestLoadBroker.mockResolvedValue(quest);
  },
  throws: ({ error }: { error: Error }): void => {
    mockQuestLoadBroker.mockRejectedValue(error);
  },
});
