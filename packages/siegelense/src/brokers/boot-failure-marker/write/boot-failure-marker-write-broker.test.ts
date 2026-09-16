import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

import { bootFailureMarkerWriteBroker } from './boot-failure-marker-write-broker';
import { bootFailureMarkerWriteBrokerProxy } from './boot-failure-marker-write-broker.proxy';

describe('bootFailureMarkerWriteBroker', () => {
  describe('the driver reports a boot failure', () => {
    it('VALID: {evidencePath, message} => writes boot-failure.json under that directory', async () => {
      const proxy = bootFailureMarkerWriteBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const message = ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' });
      const nowMs = 1_700_000_500_000;
      proxy.setupWriteSucceeds({ evidencePath, nowMs });

      const result = await bootFailureMarkerWriteBroker({ evidencePath, message });

      const expectedMarker = BootFailureMarkerStub({
        message,
        atMs: EpochMsStub({ value: nowMs }),
      });

      expect(result).toStrictEqual(expectedMarker);
      expect(proxy.getWrittenMarkerContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedMarker)}\n`,
      );
    });
  });
});
