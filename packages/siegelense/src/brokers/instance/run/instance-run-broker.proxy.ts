import { homedir } from 'os';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';

type Registry = ReturnType<typeof RegistryStub>;
type RunResult = ReturnType<typeof RunResultStub>;

// Same convention as instance-start-broker.proxy.ts: every path here is REAL `path.join` output
// off a sticky os.homedir() override, never a one-shot `pathJoinAdapter.returns()` — see that
// file's header comment for why a shared one-shot queue across unrelated resolvers is unsafe.
const HOME_DIR_VALUE = '/home/user';
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json`;
const REGISTRY_PATH_FILE = FilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });

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
} => {
  registryReadBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  const socketProxy = netUnixRequestAdapterProxy();

  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const readHandle: MockHandle = registerMock({ fn: readFile });
  registerMock({ fn: homedir }).calledWith([]).returns(HOME_DIR_VALUE);

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      existsHandle.calledWith([REGISTRY_PATH_FILE]).returns(true);
      readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));
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
  };
};
