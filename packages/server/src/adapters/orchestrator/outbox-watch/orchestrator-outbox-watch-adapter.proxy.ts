/**
 * PURPOSE: Proxy for outbox watch adapter
 *
 * WHY MOCK ADAPTER: questOutboxWatchBroker is a standalone function export from
 * @dungeonmaster/orchestrator (not a method on StartOrchestrator or orchestrationEventsState).
 * This proxy mocks the adapter itself following the language-primitive adapter pattern.
 *
 * WHY registerModuleMock + registerMock: registerModuleMock hoists jest.mock() so the module is
 * replaced before any import runs, giving every importer (including server-init-responder, which
 * calls the adapter directly rather than through this proxy) the SAME jest.fn(). registerMock
 * then wraps that shared jest.fn() with argument-addressed dispatch exactly like any other mocked
 * function — the module-mock only solves "which jest.fn()", not "how is it staged".
 *
 * WHY `calledWith([])`: the only call this adapter ever receives is `{ onQuestChanged, onError }`,
 * a pair of fresh closures the caller builds inline. Closures never compare equal to each other,
 * so there is no real per-call identity to key on — and in practice the adapter is invoked once
 * per process (server boot), so matching any call is the honest description. The base staging is
 * NOT the "hides failures" catch-all the sweep is removing: it IS the adapter's behavior — capture
 * whatever callbacks this call received so getCapturedCallbacks() can hand them back to the test.
 */
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';
import { orchestratorOutboxWatchAdapter } from './orchestrator-outbox-watch-adapter';
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
  const mock = registerMock({ fn: orchestratorOutboxWatchAdapter });

  const captured: {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { onQuestChanged: undefined, onError: undefined };

  mock
    .calledWith([])
    .implement(
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
      mock.onceFor([]).resolves({ stop });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.onceFor([]).rejects(error);
    },
    getCapturedCallbacks: (): {
      onQuestChanged: OnQuestChanged | undefined;
      onError: OnError | undefined;
    } => captured,
  };
};
