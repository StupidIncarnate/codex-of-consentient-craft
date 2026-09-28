import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
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

      await expect(bufferAppendBroker({ bufferPath, entries: [first, second] })).resolves.toBe(
        undefined,
      );

      expect(proxy.writtenEntriesFor({ bufferPath })).toStrictEqual([first, second]);
    });
  });

  describe('an empty batch', () => {
    it('EMPTY: {entries: []} => appends nothing and resolves', async () => {
      const proxy = bufferAppendBrokerProxy();
      const bufferPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/console.jsonl',
      });
      proxy.succeeds({ bufferPath });

      await expect(bufferAppendBroker({ bufferPath, entries: [] })).resolves.toBe(undefined);

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
      const error = FsErrorStub({ code: 'ENOSPC', path: String(bufferPath) });
      proxy.throws({ bufferPath, error });

      await expect(bufferAppendBroker({ bufferPath, entries: [BufferEntryStub({})] })).rejects.toBe(
        error,
      );
    });
  });
});
