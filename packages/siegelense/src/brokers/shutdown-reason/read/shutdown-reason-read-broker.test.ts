import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';

import { shutdownReasonReadBroker } from './shutdown-reason-read-broker';
import { shutdownReasonReadBrokerProxy } from './shutdown-reason-read-broker.proxy';

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
});

describe('shutdownReasonReadBroker', () => {
  describe('the driver reaped its own lane', () => {
    it('VALID: {shutdown-reason.json present} => returns the parsed marker', async () => {
      const proxy = shutdownReasonReadBrokerProxy();
      const marker = ShutdownReasonStub({
        reason: ContentTextStub({
          value: 'reaped by idle timeout after 900s with no run received',
        }),
      });
      proxy.setupMarkerFound({ evidencePath: EVIDENCE_PATH, marker });

      const result = await shutdownReasonReadBroker({ evidencePath: EVIDENCE_PATH });

      expect(result).toStrictEqual(marker);
    });
  });

  describe('the driver did not reap itself', () => {
    it('EMPTY: {shutdown-reason.json absent} => returns null', async () => {
      const proxy = shutdownReasonReadBrokerProxy();
      proxy.setupMarkerMissing({ evidencePath: EVIDENCE_PATH });

      const result = await shutdownReasonReadBroker({ evidencePath: EVIDENCE_PATH });

      expect(result).toBe(null);
    });
  });

  describe('the read fails for a reason other than absence', () => {
    it('ERROR: {EACCES} => rejects rather than treating it as missing', async () => {
      const proxy = shutdownReasonReadBrokerProxy();
      proxy.setupReadFails({
        evidencePath: EVIDENCE_PATH,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(shutdownReasonReadBroker({ evidencePath: EVIDENCE_PATH })).rejects.toThrow(
        `Failed to read file at ${EVIDENCE_PATH}/shutdown-reason.json`,
      );
    });
  });
});
