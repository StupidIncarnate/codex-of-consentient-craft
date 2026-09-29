import { dungeonmasterHomeEnsureBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/ensure/dungeonmaster-home-ensure-broker.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { tailFileProxy } from '#gateway/node/fs/tail-file/tail-file.proxy';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';

import { questOutboxWatchBroker } from './quest-outbox-watch-broker';

registerModuleMock({ module: './quest-outbox-watch-broker' });

type OnQuestChanged = (args: { questId: QuestId }) => void;
type OnError = (args: { error: unknown }) => void;

export const questOutboxWatchBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: FilePath; outboxPath: FilePath }) => void;
  setupLines: (params: { path: FilePath; lines: readonly string[] }) => void;
  triggerWatchError: (params: { path: FilePath; error: Error }) => void;
  getTruncatedPaths: () => readonly unknown[];
  getCreatedPaths: () => readonly unknown[];
  // Caller-level scenario: stages an invented, self-contained fs layer (a caller reaching this
  // broker only for its {onQuestChanged, onError, resetOnStart} contract never needs to know the
  // outbox path itself) so the REAL broker settles the call, reached whichever way a caller
  // imports it — directly, or through the bare `@dungeonmaster/orchestrator` barrel. Exposes what
  // the caller PASSED IN, since that argument is the one thing this scenario can observe that the
  // fs-level setupOutboxPath above cannot.
  setupWatchStarted: () => void;
  // Captures what the caller passed in and resolves `{ stop }` WITHOUT running the real broker, so
  // no fs, `join` or `homedir` staging is touched — for a caller whose test shares those mocks with
  // other real code. Overrides the real-broker default above for every later call.
  setupWatchCaptureOnly: () => void;
  getCapturedResetOnStart: () => boolean | undefined;
  getCapturedCallbacks: () => {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  };
} => {
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const appendProxy = appendFileProxy();
  const writeHandle = writeFileProxy();
  // Every outbox path this proxy staged: `getTruncatedPaths` reads back the writes at those addresses.
  const stagedOutboxPaths: FilePath[] = [];
  const stageStagedOutboxPaths = (entry: FilePath): void => {
    if (!stagedOutboxPaths.includes(entry)) {
      stagedOutboxPaths.push(entry);
    }
  };
  const watchTailProxy = tailFileProxy();

  const captured: {
    resetOnStart: boolean | undefined;
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { resetOnStart: undefined, onQuestChanged: undefined, onError: undefined };

  // The broker itself is mocked (registerModuleMock above) purely to intercept and capture what a
  // caller passed in — every real fs-level behavior still runs through the REAL broker via
  // requireActual, driven by the same staged homeEnsureProxy/joinHandle/watchTailProxy this file
  // wires above.
  const mocked = registerMock({ fn: questOutboxWatchBroker });
  const realMod = requireActual<{ questOutboxWatchBroker: typeof questOutboxWatchBroker }>({
    module: './quest-outbox-watch-broker',
  });
  // Any `{ onQuestChanged, onError }` call: the watch scenarios below stage the outbox the real
  // broker tails, and the caller's own callbacks are the address it can never name in advance.
  const isWatchCall = (call: unknown): boolean =>
    typeof call === 'object' && call !== null && 'onQuestChanged' in call;
  const runRealWatch = (): void => {
    mocked
      .calledWith([isWatchCall])
      .implement(
        async (params: {
          onQuestChanged: OnQuestChanged;
          onError: OnError;
          resetOnStart?: boolean;
        }): Promise<{ stop: () => void }> => {
          captured.resetOnStart = params.resetOnStart;
          captured.onQuestChanged = params.onQuestChanged;
          captured.onError = params.onError;
          return realMod.questOutboxWatchBroker(params);
        },
      );
  };

  const stageOutboxPath = ({
    homeDir,
    homePath,
    outboxPath,
  }: {
    homeDir: string;
    homePath: FilePath;
    outboxPath: FilePath;
  }): void => {
    runRealWatch();
    homeEnsureProxy.setupEnsureSuccess({
      homeDir,
      homePath,
      guildsPath: homePath,
    });
    // questOutboxWatchBroker's own join(homePath, event-outbox.jsonl) -> outboxPath, addressed by
    // the exact tuple rather than an address-less FIFO slot, so it can never answer a different
    // broker's join call sharing the same underlying mocked `join`.
    joinHandle
      .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
      .returns(outboxPath);
    // The tail opens the outbox right after the create/truncate, so its file is staged with it.
    watchTailProxy.setupFile({ path: outboxPath });
    appendProxy.succeeds({ path: outboxPath });
    stageStagedOutboxPaths(outboxPath);
    writeHandle.succeeds({ path: outboxPath });
  };

  return {
    setupOutboxPath: stageOutboxPath,

    setupLines: ({ path, lines }: { path: FilePath; lines: readonly string[] }): void => {
      watchTailProxy.setupLines({ path, lines });
    },

    triggerWatchError: ({ path, error }: { path: FilePath; error: Error }): void => {
      watchTailProxy.triggerWatchError({ path, error });
    },

    // `writeFile` is the truncate and `appendFile` the create-if-absent, so which of the two the
    // broker reached for IS the observable "did this watcher destroy the bus it came to read".
    getTruncatedPaths: (): readonly unknown[] =>
      stagedOutboxPaths.flatMap((outboxPath) =>
        writeHandle.getCallsFor({ path: outboxPath }).map((call) => call[0]),
      ),

    getCreatedPaths: (): readonly unknown[] =>
      stagedOutboxPaths.flatMap((outboxPath) =>
        appendProxy.getCallsFor({ path: outboxPath }).map((call) => call[0]),
      ),

    setupWatchStarted: (): void => {
      const homeDir = '/quest-outbox-watch-broker-proxy';
      const homePath = filePathContract.parse(`${homeDir}/.dungeonmaster`);
      const outboxPath = filePathContract.parse(`${homePath}/event-outbox.jsonl`);
      stageOutboxPath({ homeDir, homePath, outboxPath });
      // No line is ever staged in this scenario, so the tail's first drain stays open instead of
      // arming a timer that outlives the test.
      watchTailProxy.setupNextDrainNeverCloses({ path: outboxPath });
    },
    setupWatchCaptureOnly: (): void => {
      mocked
        .calledWith([isWatchCall])
        .implement(
          async (params: {
            onQuestChanged: OnQuestChanged;
            onError: OnError;
            resetOnStart?: boolean;
          }): Promise<{ stop: () => void }> => {
            captured.resetOnStart = params.resetOnStart;
            captured.onQuestChanged = params.onQuestChanged;
            captured.onError = params.onError;
            return Promise.resolve({ stop: (): void => undefined });
          },
        );
    },
    getCapturedResetOnStart: (): boolean | undefined => captured.resetOnStart,
    getCapturedCallbacks: (): {
      onQuestChanged: OnQuestChanged | undefined;
      onError: OnError | undefined;
    } => ({ onQuestChanged: captured.onQuestChanged, onError: captured.onError }),
  };
};
