import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { bootFailureMarkerReadBrokerProxy } from '../../boot-failure-marker/read/boot-failure-marker-read-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';

type BootFailureMarker = ReturnType<typeof BootFailureMarkerStub>;

export const instanceStartBootPollLayerBrokerProxy = (): {
  setupAnswersOk: (params: { socketPath: AbsoluteFilePath }) => void;
  setupNeverAnswers: (params: {
    socketPath: AbsoluteFilePath;
    evidencePath: AbsoluteFilePath;
    nowMs: number;
    deadlineMs: number;
  }) => void;
  setupFailureMarkerAppears: (params: {
    socketPath: AbsoluteFilePath;
    evidencePath: AbsoluteFilePath;
    marker: BootFailureMarker;
  }) => void;
} => {
  const socketProxy = netUnixRequestAdapterProxy();
  const markerProxy = bootFailureMarkerReadBrokerProxy();
  const dateHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupAnswersOk: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.respondsWith({ socketPath, response: DriverResponseStub({ ok: true }) });
    },

    // Fails the connect once, then stages `Date.now()` already past the deadline so the poll
    // returns { status: 'timeout' } on its first retry check instead of sleeping through a real
    // ceiling. No marker is ever written on this path.
    setupNeverAnswers: ({
      socketPath,
      evidencePath,
      nowMs,
      deadlineMs,
    }: {
      socketPath: AbsoluteFilePath;
      evidencePath: AbsoluteFilePath;
      nowMs: number;
      deadlineMs: number;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      markerProxy.setupMarkerMissing({ evidencePath });
      dateHandle.onceFor([]).returns(deadlineMs >= nowMs ? deadlineMs : nowMs);
    },

    // Fails the connect once, and a failure marker is already sitting beside the evidence —
    // the shape a driver that died before this poll's first attempt leaves behind.
    setupFailureMarkerAppears: ({
      socketPath,
      evidencePath,
      marker,
    }: {
      socketPath: AbsoluteFilePath;
      evidencePath: AbsoluteFilePath;
      marker: BootFailureMarker;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      markerProxy.setupMarkerFound({ evidencePath, marker });
    },
  };
};
