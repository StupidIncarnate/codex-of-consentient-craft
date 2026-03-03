/**
 * PURPOSE: Proxy for outbox watch adapter
 *
 * WHY MOCK ADAPTER: questOutboxWatchBroker is a standalone function export from
 * @dungeonmaster/orchestrator (not a method on StartOrchestrator or orchestrationEventsState).
 * This proxy mocks the adapter itself following the language-primitive adapter pattern.
 */
jest.mock('./orchestrator-outbox-watch-adapter', () => ({
  orchestratorOutboxWatchAdapter: jest.fn(),
}));

import type { orchestratorOutboxWatchAdapter } from './orchestrator-outbox-watch-adapter';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type OnQuestChanged = (args: { questId: QuestId }) => void;
type OnError = (args: { error: unknown }) => void;

export const orchestratorOutboxWatchAdapterProxy = (): {
  returns: (params: { stop: () => void }) => void;
  throws: (params: { error: Error }) => void;
  getCapturedCallbacks: () => {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  };
} => {
  const mod = jest.requireMock<{
    orchestratorOutboxWatchAdapter: typeof orchestratorOutboxWatchAdapter;
  }>('./orchestrator-outbox-watch-adapter');
  const mock = jest.mocked(mod.orchestratorOutboxWatchAdapter);

  const captured: {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { onQuestChanged: undefined, onError: undefined };

  mock.mockImplementation((async ({
    onQuestChanged,
    onError,
  }: {
    onQuestChanged: OnQuestChanged;
    onError: OnError;
  }): Promise<{ stop: () => void }> => {
    captured.onQuestChanged = onQuestChanged;
    captured.onError = onError;
    return Promise.resolve({ stop: jest.fn() });
  }) as typeof orchestratorOutboxWatchAdapter);

  return {
    returns: ({ stop }: { stop: () => void }): void => {
      mock.mockResolvedValueOnce({ stop });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
    getCapturedCallbacks: (): {
      onQuestChanged: OnQuestChanged | undefined;
      onError: OnError | undefined;
    } => captured,
  };
};
