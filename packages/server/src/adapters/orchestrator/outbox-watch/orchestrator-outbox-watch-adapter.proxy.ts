/**
 * PURPOSE: Proxy for outbox watch adapter
 *
 * WHY MOCK ADAPTER: questOutboxWatchBroker is a standalone function export from
 * @dungeonmaster/orchestrator (not a method on StartOrchestrator or orchestrationEventsState).
 * This proxy mocks the adapter itself following the language-primitive adapter pattern.
 *
 * WHY registerModuleMock + import binding: registerModuleMock hoists jest.mock() so the
 * module is replaced before any import runs. The import binding then points at the jest.fn()
 * created by the factory. Calling .mockImplementation() directly on the binding (via cast)
 * sets a global default for ALL callers — needed because server-init-responder calls the
 * adapter directly, so registerMock's stack-based dispatch cannot intercept it.
 */
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';
import { orchestratorOutboxWatchAdapter } from './orchestrator-outbox-watch-adapter';
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
  const mock = orchestratorOutboxWatchAdapter as unknown as jest.MockedFunction<
    typeof OutboxWatchType
  >;

  const captured: {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { onQuestChanged: undefined, onError: undefined };

  mock.mockImplementation(
    async ({
      onQuestChanged,
      onError,
    }: {
      onQuestChanged: OnQuestChanged;
      onError: OnError;
    }): Promise<{ stop: () => void }> => {
      captured.onQuestChanged = onQuestChanged;
      captured.onError = onError;
      return Promise.resolve({ stop: jest.fn() });
    },
  );

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
