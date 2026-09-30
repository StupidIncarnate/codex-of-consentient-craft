import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

import { driverSocketRequestBrokerProxy } from '../../driver/socket-request/driver-socket-request-broker.proxy';
import { bootFailureMarkerReadBrokerProxy } from '../../boot-failure-marker/read/boot-failure-marker-read-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';

type BootFailureMarker = ReturnType<typeof BootFailureMarkerStub>;

export const instanceStartBootPollLayerBrokerProxy = (): {
  setupAnswersOk: (params: { socketPath: string }) => void;
  setupNeverAnswers: (params: {
    socketPath: string;
    evidencePath: string;
    nowMs: number;
    deadlineMs: number;
  }) => void;
  setupFailureMarkerAppears: (params: {
    socketPath: string;
    evidencePath: string;
    marker: BootFailureMarker;
  }) => void;
} => {
  const socketProxy = driverSocketRequestBrokerProxy();
  const markerProxy = bootFailureMarkerReadBrokerProxy();
  const clockProxy = nowProxy();
  setTimeoutProxy();

  return {
    setupAnswersOk: ({ socketPath }: { socketPath: string }): void => {
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
      socketPath: string;
      evidencePath: string;
      nowMs: number;
      deadlineMs: number;
    }): void => {
      socketProxy.connectFailsRefused({ socketPath });
      markerProxy.setupMarkerMissing({ evidencePath });
      clockProxy.setupNowOnce({ ms: deadlineMs >= nowMs ? deadlineMs : nowMs });
    },

    // Fails the connect once, and a failure marker is already sitting beside the evidence —
    // the shape a driver that died before this poll's first attempt leaves behind.
    setupFailureMarkerAppears: ({
      socketPath,
      evidencePath,
      marker,
    }: {
      socketPath: string;
      evidencePath: string;
      marker: BootFailureMarker;
    }): void => {
      socketProxy.connectFailsRefused({ socketPath });
      markerProxy.setupMarkerFound({ evidencePath, marker });
    },
  };
};
