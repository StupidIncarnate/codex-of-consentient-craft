import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { chatReplayJsonlReadBroker } from './chat-replay-jsonl-read-broker';
import { chatReplayJsonlReadBrokerProxy } from './chat-replay-jsonl-read-broker.proxy';

describe('chatReplayJsonlReadBroker', () => {
  describe('JSONL read with retry on ENOENT', () => {
    it('VALID: {file readable on first attempt} => returns parsed lines', async () => {
      const proxy = chatReplayJsonlReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/session.jsonl' });
      proxy.returns({ filePath, content: '{"type":"system"}\n{"type":"assistant"}\n' });

      const result = await chatReplayJsonlReadBroker({ filePath });

      expect(result).toStrictEqual(['{"type":"system"}', '{"type":"assistant"}']);
    });

    it('VALID: {ENOENT once, then file appears} => retries and returns parsed lines', async () => {
      const proxy = chatReplayJsonlReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/session.jsonl' });
      // throwsOnce wins over the sticky `returns` for the SAME filePath on the first call only,
      // so the first read genuinely ENOENTs and the broker's retry loop is what makes the
      // second read (which lands on the sticky `returns`) succeed.
      proxy.throwsOnce({ filePath, error: new Error('ENOENT: no such file or directory') });
      proxy.returns({ filePath, content: '{"type":"system"}\n' });

      const result = await chatReplayJsonlReadBroker({ filePath });

      expect(result).toStrictEqual(['{"type":"system"}']);
    });

    it('ERROR: {ENOENT past deadline} => throws ENOENT', async () => {
      const proxy = chatReplayJsonlReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/session.jsonl' });
      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      await expect(
        chatReplayJsonlReadBroker({
          filePath,
          deadline: Date.now() - 1,
        }),
      ).rejects.toThrow(/ENOENT/u);
    });

    it('ERROR: {non-ENOENT error} => throws immediately without retry', async () => {
      const proxy = chatReplayJsonlReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/session.jsonl' });
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(chatReplayJsonlReadBroker({ filePath })).rejects.toThrow(/EACCES/u);
    });
  });
});
