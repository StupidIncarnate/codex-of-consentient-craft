/**
 * PURPOSE: Proxy for orchestratorUpdateQuestStepAdapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorUpdateQuestStepAdapterProxy();
 * proxy.succeeds();
 */
import * as orchestrator from '@dungeonmaster/orchestrator';

jest.mock('@dungeonmaster/orchestrator', () => ({
  questUpdateStepBroker: jest.fn(),
}));

const mockQuestUpdateStepBroker = jest.mocked(orchestrator.questUpdateStepBroker);

export const orchestratorUpdateQuestStepAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => ({
  succeeds: (): void => {
    mockQuestUpdateStepBroker.mockResolvedValue(undefined);
  },
  throws: ({ error }: { error: Error }): void => {
    mockQuestUpdateStepBroker.mockRejectedValue(error);
  },
});
