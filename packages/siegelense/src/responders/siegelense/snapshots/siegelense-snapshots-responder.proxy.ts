/**
 * PURPOSE: Test proxy for SiegelenseSnapshotsResponder — mocks `snapshotListBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseCompareResponderProxy`'s shape
 * for the sibling command. `snapshotListBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseSnapshotsResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { snapshotListBroker } from '../../../brokers/snapshot/list/snapshot-list-broker';
import { snapshotListBrokerProxy } from '../../../brokers/snapshot/list/snapshot-list-broker.proxy';
import type { SnapshotsAnswerStub } from '../../../contracts/snapshots-answer/snapshots-answer.stub';

type SnapshotsAnswer = ReturnType<typeof SnapshotsAnswerStub>;

export const SiegelenseSnapshotsResponderProxy = (): {
  stageAnswer: (params: { answer: SnapshotsAnswer }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages snapshotListBroker
  // directly below, never through its own setup methods.
  snapshotListBrokerProxy();

  const listHandle = registerMock({ fn: snapshotListBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: SnapshotsAnswer }): void => {
      listHandle.calledWith([]).resolves(answer);
    },

    stageError: ({ error }: { error: Error }): void => {
      listHandle.calledWith([]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
