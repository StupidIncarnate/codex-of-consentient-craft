import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';

import { bootFailureMarkerWriteBroker } from './boot-failure-marker-write-broker';
import { bootFailureMarkerWriteBrokerProxy } from './boot-failure-marker-write-broker.proxy';

describe('bootFailureMarkerWriteBroker', () => {
  describe('the driver reports a boot failure', () => {
    it('VALID: {evidencePath, message} => writes boot-failure.json under that directory', async () => {
      const proxy = bootFailureMarkerWriteBrokerProxy();
      const evidencePath = '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21';
      const message = 'CLAUDE_CLI_PATH is required';
      const nowMs = 1_700_000_500_000;
      proxy.setupWriteSucceeds({ evidencePath, nowMs });

      const result = await bootFailureMarkerWriteBroker({ evidencePath, message });

      const expectedMarker = BootFailureMarkerStub({
        message,
        atMs: nowMs,
      });

      expect(result).toStrictEqual(expectedMarker);
      expect(proxy.getWrittenMarkerContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedMarker)}\n`,
      );
    });
  });
});
