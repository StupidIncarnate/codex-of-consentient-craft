import {
  dungeonmasterHomeEnsureBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';
import { questOutboxWatchBroker } from './quest-outbox-watch-broker';
// Self-referencing package import, deliberately separate from the relative one above: a caller
// outside this package (server) reaches this broker through the bare `@dungeonmaster/orchestrator`
// barrel, and jest.mock() keys on the resolved module path — a barrel automock (forced whenever the
// SAME test also composes StartOrchestratorProxy, per the merge rule in
// mock-calls-merge-by-module-transformer.ts) replaces the barrel's OWN `questOutboxWatchBroker`
// binding with a fresh, disconnected stub, unrelated to the real broker this file otherwise stages.
// Same shape as start-orchestrator.proxy.ts's own self-import of StartOrchestrator.
import { questOutboxWatchBroker as questOutboxWatchBrokerBarrelExport } from '@dungeonmaster/orchestrator';

type OnQuestChanged = (args: { questId: QuestId }) => void;
type OnError = (args: { error: unknown }) => void;

export const questOutboxWatchBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: FilePath; outboxPath: FilePath }) => void;
  triggerChange: () => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerWatchError: (params: { error: Error }) => void;
  getTruncatedPaths: () => readonly unknown[];
  getCreatedPaths: () => readonly unknown[];
  // Caller-level scenario: stages an invented, self-contained fs layer (a caller reaching this
  // broker only for its {onQuestChanged, onError, resetOnStart} contract never needs to know the
  // outbox path itself) so the REAL broker settles the call, reached whichever way a caller
  // imports it — directly, or through the bare `@dungeonmaster/orchestrator` barrel. Exposes what
  // the caller PASSED IN, since that argument is the one thing this scenario can observe that the
  // fs-level setupOutboxPath above cannot.
  setupWatchStarted: () => void;
  getCapturedResetOnStart: () => boolean | undefined;
  getCapturedCallbacks: () => {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  };
} => {
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const appendFileProxy = fsAppendFileAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const watchTailProxy = fsWatchTailAdapterProxy();

  const stageOutboxPath = ({
    homeDir,
    homePath,
    outboxPath,
  }: {
    homeDir: string;
    homePath: FilePath;
    outboxPath: FilePath;
  }): void => {
    homeEnsureProxy.setupEnsureSuccess({
      homeDir,
      homePath,
      guildsPath: homePath,
    });
    pathJoinProxy.returns({ result: outboxPath });
    appendFileProxy.succeeds({ filePath: outboxPath });
    writeFileProxy.succeeds({ filePath: outboxPath });
  };

  const captured: {
    resetOnStart: boolean | undefined;
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { resetOnStart: undefined, onQuestChanged: undefined, onError: undefined };

  // The barrel-reached mock is a SEPARATE stub from the real, relatively-imported broker above
  // (different resolved module), so it needs its own wiring — delegating every call to the real
  // broker while capturing exactly what the caller passed in.
  const barrelMocked = registerMock({ fn: questOutboxWatchBrokerBarrelExport });
  barrelMocked
    .calledWith([])
    .implement(
      async (params: {
        onQuestChanged: OnQuestChanged;
        onError: OnError;
        resetOnStart?: boolean;
      }): Promise<{ stop: () => void }> => {
        captured.resetOnStart = params.resetOnStart;
        captured.onQuestChanged = params.onQuestChanged;
        captured.onError = params.onError;
        return questOutboxWatchBroker(params);
      },
    );

  return {
    setupOutboxPath: stageOutboxPath,

    triggerChange: (): void => {
      watchTailProxy.triggerChange();
    },

    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      watchTailProxy.setupLines({ lines });
    },

    triggerWatchError: ({ error }: { error: Error }): void => {
      watchTailProxy.triggerWatchError({ error });
    },

    // `writeFile` is the truncate and `appendFile` the create-if-absent, so which of the two the
    // broker reached for IS the observable "did this watcher destroy the bus it came to read".
    getTruncatedPaths: (): readonly unknown[] =>
      writeFileProxy.getAllWrittenFiles().map((written) => written.path),

    getCreatedPaths: (): readonly unknown[] =>
      appendFileProxy.getAllAppendedFiles().map((appended) => appended.path),

    setupWatchStarted: (): void => {
      const homeDir = '/quest-outbox-watch-broker-proxy';
      const homePath = filePathContract.parse(`${homeDir}/.dungeonmaster`);
      const outboxPath = filePathContract.parse(`${homePath}/event-outbox.jsonl`);
      stageOutboxPath({ homeDir, homePath, outboxPath });
    },
    getCapturedResetOnStart: (): boolean | undefined => captured.resetOnStart,
    getCapturedCallbacks: (): {
      onQuestChanged: OnQuestChanged | undefined;
      onError: OnError | undefined;
    } => ({ onQuestChanged: captured.onQuestChanged, onError: captured.onError }),
  };
};
