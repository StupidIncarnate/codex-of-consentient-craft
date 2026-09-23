import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { BufferEntryStub } from '../../../contracts/buffer-entry/buffer-entry.stub';

import { bufferAppendBroker } from './buffer-append-broker';
import { bufferAppendBrokerProxy } from './buffer-append-broker.proxy';

describe('bufferAppendBroker', () => {
  describe('two entries', () => {
    it('VALID: {two entries} => the raw written bytes are two newline-terminated JSON lines', async () => {
      const proxy = bufferAppendBrokerProxy();
      const bufferPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/console.jsonl',
      });
      const first = BufferEntryStub({});
      const second = BufferEntryStub({});
      proxy.succeeds({ bufferPath });

      await bufferAppendBroker({ bufferPath, entries: [first, second] });

      expect(proxy.appendCallsFor({ bufferPath })).toStrictEqual([
        `${JSON.stringify(first)}\n${JSON.stringify(second)}\n`,
      ]);
    });

    it('VALID: {two entries} => the written bytes parse back to exactly those two entries', async () => {
      const proxy = bufferAppendBrokerProxy();
      const bufferPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/console.jsonl',
      });
      const first = BufferEntryStub({});
      const second = BufferEntryStub({});
      proxy.succeeds({ bufferPath });

      const result = await bufferAppendBroker({ bufferPath, entries: [first, second] });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.writtenEntriesFor({ bufferPath })).toStrictEqual([first, second]);
    });
  });

  describe('an empty batch', () => {
    it('EMPTY: {entries: []} => appends nothing and still returns success', async () => {
      const proxy = bufferAppendBrokerProxy();
      const bufferPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/console.jsonl',
      });
      proxy.succeeds({ bufferPath });

      const result = await bufferAppendBroker({ bufferPath, entries: [] });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.appendCallsFor({ bufferPath })).toStrictEqual([]);
    });
  });

  describe('the adapter rejects', () => {
    it('ERROR: {disk write fails} => the append broker rejects with the same error', async () => {
      const proxy = bufferAppendBrokerProxy();
      const bufferPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/network.jsonl',
      });
      proxy.throws({ bufferPath, error: new Error('ENOSPC') });

      const error = await bufferAppendBroker({
        bufferPath,
        entries: [BufferEntryStub({})],
      }).then(
        (): never => {
          throw new Error('Expected bufferAppendBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('ENOSPC');
    });
  });
});
