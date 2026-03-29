/**
 * PURPOSE: Proxy for outbox watch adapter
 *
 * WHY MOCK ADAPTER: questOutboxWatchBroker is a standalone function export from
 * @dungeonmaster/orchestrator (not a method on StartOrchestrator or orchestrationEventsState).
 * This proxy mocks the adapter itself following the language-primitive adapter pattern.
 */
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { orchestratorOutboxWatchAdapter as OutboxWatchType } from './orchestrator-outbox-watch-adapter';
import type { QuestId } from '@dungeonmaster/shared/contracts';

registerModuleMock({
  module: './orchestrator-outbox-watch-adapter',
  factory: () => ({
    orchestratorOutboxWatchAdapter: jest.fn(),
  }),
});

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
  const mod = require('./orchestrator-outbox-watch-adapter') as {
    orchestratorOutboxWatchAdapter: jest.MockedFunction<typeof OutboxWatchType>;
  };
  const mock = mod.orchestratorOutboxWatchAdapter;

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
  }) as typeof OutboxWatchType);

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
