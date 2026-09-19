import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';

import { bootFailureMarkerReadBroker } from './boot-failure-marker-read-broker';
import { bootFailureMarkerReadBrokerProxy } from './boot-failure-marker-read-broker.proxy';

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
});

describe('bootFailureMarkerReadBroker', () => {
  describe('the driver reported a boot failure', () => {
    it('VALID: {boot-failure.json present} => returns the parsed marker', async () => {
      const proxy = bootFailureMarkerReadBrokerProxy();
      const marker = BootFailureMarkerStub({
        message: ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' }),
      });
      proxy.setupMarkerFound({ evidencePath: EVIDENCE_PATH, marker });

      const result = await bootFailureMarkerReadBroker({ evidencePath: EVIDENCE_PATH });

      expect(result).toStrictEqual(marker);
    });
  });

  describe('the boot has not failed', () => {
    it('EMPTY: {boot-failure.json absent} => returns null', async () => {
      const proxy = bootFailureMarkerReadBrokerProxy();
      proxy.setupMarkerMissing({ evidencePath: EVIDENCE_PATH });

      const result = await bootFailureMarkerReadBroker({ evidencePath: EVIDENCE_PATH });

      expect(result).toBe(null);
    });
  });

  describe('the read fails for a reason other than absence', () => {
    it('ERROR: {EACCES} => rejects rather than treating it as missing', async () => {
      const proxy = bootFailureMarkerReadBrokerProxy();
      proxy.setupReadFails({
        evidencePath: EVIDENCE_PATH,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(bootFailureMarkerReadBroker({ evidencePath: EVIDENCE_PATH })).rejects.toThrow(
        `Failed to read file at ${EVIDENCE_PATH}/boot-failure.json`,
      );
    });
  });
});
