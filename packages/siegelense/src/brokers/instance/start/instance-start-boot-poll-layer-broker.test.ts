import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { instanceStartBootPollLayerBroker } from './instance-start-boot-poll-layer-broker';
import { instanceStartBootPollLayerBrokerProxy } from './instance-start-boot-poll-layer-broker.proxy';
import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

const SOCKET_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' });
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
});

describe('instanceStartBootPollLayerBroker', () => {
  describe('driver answers', () => {
    it('VALID: {ping answers ok} => returns { status: ready }', async () => {
      const proxy = instanceStartBootPollLayerBrokerProxy();
      proxy.setupAnswersOk({ socketPath: SOCKET_PATH });

      const result = await instanceStartBootPollLayerBroker({
        socketPath: SOCKET_PATH,
        deadlineMs: EpochMsStub({ value: 1_700_000_180_000 }),
        evidencePath: EVIDENCE_PATH,
      });

      expect(result).toStrictEqual({ status: 'ready' });
    });
  });

  describe('driver never answers and never reports a failure', () => {
    it('ERROR: {connect fails, deadline already passed, no marker} => returns { status: timeout }', async () => {
      const proxy = instanceStartBootPollLayerBrokerProxy();
      const nowMs = 1_700_000_180_000;
      const deadlineMs = 1_700_000_000_000;
      proxy.setupNeverAnswers({
        socketPath: SOCKET_PATH,
        evidencePath: EVIDENCE_PATH,
        nowMs,
        deadlineMs,
      });

      const result = await instanceStartBootPollLayerBroker({
        socketPath: SOCKET_PATH,
        deadlineMs: EpochMsStub({ value: deadlineMs }),
        evidencePath: EVIDENCE_PATH,
      });

      expect(result).toStrictEqual({ status: 'timeout' });
    });
  });

  describe('the driver reported its own boot failure', () => {
    it('ERROR: {connect fails, boot-failure.json present} => returns { status: failed, message } before the deadline', async () => {
      const proxy = instanceStartBootPollLayerBrokerProxy();
      const marker = BootFailureMarkerStub({
        message: ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' }),
      });
      proxy.setupFailureMarkerAppears({
        socketPath: SOCKET_PATH,
        evidencePath: EVIDENCE_PATH,
        marker,
      });

      // A deadline far in the future (Date.now() is not staged for this scenario at all) — this
      // outcome must arrive on the very first failed ping, before the broker ever checks the
      // deadline, never by waiting the timeout path out.
      const result = await instanceStartBootPollLayerBroker({
        socketPath: SOCKET_PATH,
        deadlineMs: EpochMsStub({ value: 9_999_999_999_999 }),
        evidencePath: EVIDENCE_PATH,
      });

      expect(result).toStrictEqual({ status: 'failed', message: 'CLAUDE_CLI_PATH is required' });
    });
  });
});
