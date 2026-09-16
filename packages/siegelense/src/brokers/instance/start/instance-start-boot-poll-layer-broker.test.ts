import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { instanceStartBootPollLayerBroker } from './instance-start-boot-poll-layer-broker';
import { instanceStartBootPollLayerBrokerProxy } from './instance-start-boot-poll-layer-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

const SOCKET_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' });

describe('instanceStartBootPollLayerBroker', () => {
  describe('driver answers', () => {
    it('VALID: {ping answers ok} => returns true', async () => {
      const proxy = instanceStartBootPollLayerBrokerProxy();
      proxy.setupAnswersOk({ socketPath: SOCKET_PATH });

      const result = await instanceStartBootPollLayerBroker({
        socketPath: SOCKET_PATH,
        deadlineMs: EpochMsStub({ value: 1_700_000_180_000 }),
      });

      expect(result).toBe(true);
    });
  });

  describe('driver never answers', () => {
    it('ERROR: {connect fails, deadline already passed} => returns false', async () => {
      const proxy = instanceStartBootPollLayerBrokerProxy();
      const nowMs = 1_700_000_180_000;
      const deadlineMs = 1_700_000_000_000;
      proxy.setupNeverAnswers({ socketPath: SOCKET_PATH, nowMs, deadlineMs });

      const result = await instanceStartBootPollLayerBroker({
        socketPath: SOCKET_PATH,
        deadlineMs: EpochMsStub({ value: deadlineMs }),
      });

      expect(result).toBe(false);
    });
  });
});
