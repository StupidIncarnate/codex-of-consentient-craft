import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { laneTeardownBroker } from './lane-teardown-broker';
import { laneTeardownBrokerProxy } from './lane-teardown-broker.proxy';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';

describe('laneTeardownBroker', () => {
  describe('the SIGTERM-then-SIGKILL escalation', () => {
    it('VALID: {three live groups} => SIGTERM each, then SIGKILL each in that order', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const pgidA = ProcessGroupIdStub({ value: 4821 });
      const pgidB = ProcessGroupIdStub({ value: 4822 });
      const pgidC = ProcessGroupIdStub({ value: 4823 });
      proxy.setupLiveGroup({ pgid: pgidA });
      proxy.setupLiveGroup({ pgid: pgidB });
      proxy.setupLiveGroup({ pgid: pgidC });
      proxy.setupGraceElapsesInstantly();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: null,
        pgids: [pgidA, pgidB, pgidC],
      });

      const result = await laneTeardownBroker({ session, instanceId });

      expect(proxy.getKillCallsFor({ pgid: pgidA })).toStrictEqual(['SIGTERM', 'SIGKILL']);
      expect(proxy.getKillCallsFor({ pgid: pgidB })).toStrictEqual(['SIGTERM', 'SIGKILL']);
      expect(proxy.getKillCallsFor({ pgid: pgidC })).toStrictEqual(['SIGTERM', 'SIGKILL']);
      expect(result).toStrictEqual(
        KillResultStub({
          instanceId,
          stopped: true,
          portsReleased: [session.ports.api, session.ports.web],
          homeRemoved: true,
          evidenceKept: RepoLocalPathStub({
            path: proxy.getExpectedRepoLocalEvidencePath(),
            linkPresent: true,
          }),
          reapedPgids: [],
        }),
      );
    });
  });

  describe('a process group that already exited', () => {
    it('VALID: {one dead group, one live group} => the dead group gets no signal and the live group gets both', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const deadPgid = ProcessGroupIdStub({ value: 5001 });
      const livePgid = ProcessGroupIdStub({ value: 5002 });
      proxy.setupAlreadyGoneGroup({ pgid: deadPgid });
      proxy.setupLiveGroup({ pgid: livePgid });
      proxy.setupGraceElapsesInstantly();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: null,
        pgids: [deadPgid, livePgid],
      });

      await laneTeardownBroker({ session, instanceId });

      expect(proxy.getKillCallsFor({ pgid: deadPgid })).toStrictEqual([]);
      expect(proxy.getKillCallsFor({ pgid: livePgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });
  });

  describe('the throwaway home versus the evidence directory', () => {
    it('VALID: {teardown} => the home is removed and the evidence path is never passed to fsRmAdapter', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: null,
        pgids: [],
      });

      const result = await laneTeardownBroker({ session, instanceId });

      expect(proxy.getRemovedPaths()).toStrictEqual([homePath]);
      expect(result.evidenceKept).toStrictEqual(
        RepoLocalPathStub({ path: proxy.getExpectedRepoLocalEvidencePath(), linkPresent: true }),
      );
    });
  });

  describe('a headless lane, with no browser', () => {
    it('VALID: {no browser} => headless teardown still kills its group', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const pgid = ProcessGroupIdStub({ value: 6001 });
      proxy.setupLiveGroup({ pgid });
      proxy.setupGraceElapsesInstantly();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: null,
        pgids: [pgid],
      });

      await laneTeardownBroker({ session, instanceId });

      expect(proxy.getKillCallsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });
  });

  describe('partial teardown — a live browser alongside live servers', () => {
    it('VALID: {browser and one server both live} => the browser closes AND the server is still signalled', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const pgid = ProcessGroupIdStub({ value: 7001 });
      proxy.setupLiveGroup({ pgid });
      proxy.setupGraceElapsesInstantly();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const closeMock = jest.fn(async (): Promise<void> => Promise.resolve());
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: BrowserSessionStub({ close: closeMock }),
        pgids: [pgid],
      });

      await laneTeardownBroker({ session, instanceId });

      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(proxy.getKillCallsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });
  });

  describe('a browser that fails to close', () => {
    it('ERROR: {browser.close rejects} => the process groups are still killed and the failure is reported', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const pgid = ProcessGroupIdStub({ value: 8001 });
      proxy.setupLiveGroup({ pgid });
      proxy.setupGraceElapsesInstantly();
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
      stderrSpy.calledWith([]).implement(() => true);
      const closeMock = jest.fn(async (): Promise<void> => Promise.reject(new Error('close boom')));
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: BrowserSessionStub({ close: closeMock }),
        pgids: [pgid],
      });

      await laneTeardownBroker({ session, instanceId });

      expect(proxy.getKillCallsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);

      const stderrCalls = [...stderrSpy.callsMatching([])];

      expect(stderrCalls.at(-1)?.[0]).toBe(
        `[lane-teardown] browser close failed for instance ${instanceId}: Error: close boom\n`,
      );
    });
  });

  describe('the released ports', () => {
    it('VALID: {a port pair} => portsReleased names both the api and web ports', async () => {
      const proxy = laneTeardownBrokerProxy();
      const instanceId = InstanceIdStub();
      const ports = PortPairStub({ api: 40_001, web: 40_002 });
      const { homePath } = LaneSessionStub();
      proxy.setupHomeRemoved({ homePath });
      proxy.setupEvidenceResolved();
      const session = LaneSessionStub({
        homePath,
        evidencePath: proxy.getEvidencePath(),
        browser: null,
        ports,
        pgids: [],
      });

      const result = await laneTeardownBroker({ session, instanceId });

      expect(result.portsReleased).toStrictEqual([40_001, 40_002]);
    });
  });
});
