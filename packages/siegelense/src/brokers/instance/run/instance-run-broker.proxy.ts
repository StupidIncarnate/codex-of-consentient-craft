import { homedir } from 'os';
import { existsSync } from 'fs';
import { readFile, rename, unlink, writeFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';

type Registry = ReturnType<typeof RegistryStub>;
type RunResult = ReturnType<typeof RunResultStub>;

// Same convention as instance-start-broker.proxy.ts: every path here is REAL `path.join` output
// off a sticky os.homedir() override, never a one-shot `pathJoinAdapter.returns()` — see that
// file's header comment for why a shared one-shot queue across unrelated resolvers is unsafe. This
// file never composes `pathJoinAdapterProxy` (directly or through `registryUpdateBrokerProxy`'s own
// setup methods) for exactly that reason: `instanceRunBroker` makes its OWN plain registry read
// BEFORE the mark-unusable path's read-lock-mutate-write cycle ever runs, and a one-shot queued for
// the second read would be silently consumed by the first instead.
//
// `packages/testing/src/jest.setup-home.js` sets a REAL `process.env.DUNGEONMASTER_HOME` before
// this file's own imports run (a `setupFiles` entry, global to every package). Left alone,
// `dungeonmasterHomeFindBroker` — what `locationsRootPathFindBroker` composes, underneath both the
// registry and the lock resolvers — returns that env value VERBATIM and never calls `homedir()` at
// all, so the `homedir` mock below would sit unused while every real registry/lock path resolves
// under that jest sandbox home instead of the fixed value this file's own constants assume. Cleared
// here, once, so every scenario resolves deterministically off the mocked `homedir()` instead.
const HOME_DIR_VALUE = '/home/user';
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json`;
const REGISTRY_TMP_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json.tmp`;
const REGISTRY_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.lock`;
const REGISTRY_PATH_FILE = FilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_TMP_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_TMP_PATH_VALUE });
const REGISTRY_LOCK_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_LOCK_PATH_VALUE });
// registryLockAcquireBroker stamps a brand-new lock file with this — the exclusive create always
// succeeds in every scenario this proxy stages (nothing ever pre-creates registry.lock), so the
// stale-lock branch that would actually COMPARE this value is never reached; any fixed number
// answers `Date.now()`'s two calls honestly without a caller-supplied one.
const LOCK_STAMP_MS = 1_700_000_000_000;

export const instanceRunBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupDriverAnswers: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    runResult: RunResult;
  }) => void;
  setupDriverUnreachable: (params: { socketPath: ReturnType<typeof AbsoluteFilePathStub> }) => void;
  setupDriverReportsFailure: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    errorMessage: string;
  }) => void;
  getRunRequestWritten: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
  }) => unknown;
  getWrittenRegistry: () => unknown;
} => {
  registryReadBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  // Composed for `enforce-proxy-child-creation` only — its own `setupCurrentRegistry` (the
  // one-shot-pathJoin-queue path) is never called, per the header comment above. Bare construction
  // is harmless: it nests `fsMkdirAdapterProxy` (registryWriteBroker's own `mkdir -p`), whose
  // constructor stages a permissive `calledWith([]).resolves(...)` default that covers
  // registryLockAcquireBroker's `mkdir -p` too, since both share the same underlying mock.
  registryUpdateBrokerProxy();
  const socketProxy = netUnixRequestAdapterProxy();

  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const writeHandle: MockHandle = registerMock({ fn: writeFile });
  const renameHandle: MockHandle = registerMock({ fn: rename });
  const unlinkHandle: MockHandle = registerMock({ fn: unlink });
  registerMock({ fn: homedir }).calledWith([]).returns(HOME_DIR_VALUE);
  const nowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });
  nowHandle.calledWith([]).returns(LOCK_STAMP_MS);

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      // Cleared here, not in the constructor (enforce-proxy-patterns confines constructor bodies
      // to child-proxy creation and handle staging) — see the header comment on why this must
      // happen before any real path resolution runs.
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      existsHandle.calledWith([REGISTRY_PATH_FILE]).returns(true);
      readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));

      // Stages the whole mark-unusable write cycle unconditionally (registry.lock's exclusive
      // create, the registry.json.tmp write, the rename over registry.json, and the lock's
      // release unlink) — harmless to leave staged for a scenario that never reaches it, since an
      // unaddressed mock only throws when something actually CALLS it unstaged.
      writeHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
      writeHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
      renameHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
      unlinkHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
    },

    setupDriverAnswers: ({
      socketPath,
      runResult,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
      runResult: RunResult;
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({ ok: true, payload: JSON.stringify(runResult) }),
      });
    },

    setupDriverUnreachable: ({
      socketPath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
    },

    setupDriverReportsFailure: ({
      socketPath,
      errorMessage,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
      errorMessage: string;
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({ ok: false, payload: '', error: errorMessage }),
      });
    },

    getRunRequestWritten: ({
      socketPath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    }): unknown => socketProxy.getWrittenFor({ socketPath }),

    getWrittenRegistry: (): unknown => {
      const calls = writeHandle.callsMatching([REGISTRY_TMP_PATH_ABS]);
      const lastCall = calls[calls.length - 1];
      return lastCall === undefined ? undefined : JSON.parse(String(lastCall[1]));
    },
  };
};
