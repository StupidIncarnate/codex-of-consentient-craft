import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';

import { shutdownReasonWriteBroker } from './shutdown-reason-write-broker';
import { shutdownReasonWriteBrokerProxy } from './shutdown-reason-write-broker.proxy';

describe('shutdownReasonWriteBroker', () => {
  describe('the driver reaps its own lane', () => {
    it('VALID: {evidencePath, reason} => writes shutdown-reason.json under that directory', async () => {
      const proxy = shutdownReasonWriteBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const reason = ContentTextStub({
        value: 'reaped by idle timeout after 900s with no run received',
      });
      const nowMs = 1_700_000_500_000;
      proxy.setupWriteSucceeds({ evidencePath, nowMs });

      const result = await shutdownReasonWriteBroker({ evidencePath, reason });

      const expectedMarker = ShutdownReasonStub({
        reason,
        atMs: EpochMsStub({ value: nowMs }),
      });

      expect(result).toStrictEqual(expectedMarker);
      expect(proxy.getWrittenMarkerContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedMarker)}\n`,
      );
    });
  });
});
