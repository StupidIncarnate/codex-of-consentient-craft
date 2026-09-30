import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { driverSocketRequestBrokerProxy } from '../../driver/socket-request/driver-socket-request-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';

type Registry = ReturnType<typeof RegistryStub>;
type RunResult = ReturnType<typeof RunResultStub>;

// `instanceRunBroker` reads the registry once up front, and its mark-unusable path runs a second
// read-lock-mutate-write cycle. Both are staged through the registry proxies' own semantic
// methods, each addressed by the exact path it resolves, so the two reads never depend on call
// order.
export const instanceRunBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupDriverAnswers: (params: { socketPath: string; runResult: RunResult }) => void;
  setupDriverUnreachable: (params: { socketPath: string }) => void;
  setupDriverReportsFailure: (params: { socketPath: string; errorMessage: string }) => void;
  getRunRequestWritten: (params: { socketPath: string }) => unknown;
  getWrittenRegistry: () => unknown;
} => {
  const registryProxy = registryReadBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  const updateProxy = registryUpdateBrokerProxy();
  const socketProxy = driverSocketRequestBrokerProxy();

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      const json = JSON.stringify(registry);
      registryProxy.setupPresentRegistry({ content: json });
      updateProxy.setupCurrentRegistry({ json });
    },

    setupDriverAnswers: ({
      socketPath,
      runResult,
    }: {
      socketPath: string;
      runResult: RunResult;
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({ ok: true, payload: JSON.stringify(runResult) }),
      });
    },

    setupDriverUnreachable: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.connectFailsRefused({ socketPath });
    },

    setupDriverReportsFailure: ({
      socketPath,
      errorMessage,
    }: {
      socketPath: string;
      errorMessage: string;
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({ ok: false, payload: '', error: errorMessage }),
      });
    },

    getRunRequestWritten: ({ socketPath }: { socketPath: string }): unknown =>
      socketProxy.getRequestLinesFor({ socketPath }).at(-1),

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },
  };
};
