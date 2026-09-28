import { appendLinesCreatingParent } from './append-lines-creating-parent';
import { appendLinesCreatingParentProxy } from './append-lines-creating-parent.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('appendLinesCreatingParent', () => {
  it('VALID: {parent missing, lines: two entries} => creates the parent then appends both lines', async () => {
    const proxy = appendLinesCreatingParentProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/event-outbox.jsonl' });

    await expect(
      appendLinesCreatingParent({
        path: '/repo/.dungeonmaster/event-outbox.jsonl',
        lines: ['{"a":1}', '{"a":2}'],
      }),
    ).resolves.toBe(undefined);
    expect(proxy.appendedContentsFor({ path: '/repo/.dungeonmaster/event-outbox.jsonl' })).toBe(
      '{"a":1}\n{"a":2}\n',
    );
  });

  it('EMPTY: {lines: []} => writes nothing and creates no directory', async () => {
    const proxy = appendLinesCreatingParentProxy();

    await expect(
      appendLinesCreatingParent({ path: '/repo/.dungeonmaster/event-outbox.jsonl', lines: [] }),
    ).resolves.toBe(undefined);
    expect(proxy.mkdirCallsFor({ path: '/repo/.dungeonmaster/event-outbox.jsonl' })).toStrictEqual(
      [],
    );
  });

  it('ERROR: {mkdir rejects with EACCES} => rejects without appending', async () => {
    const proxy = appendLinesCreatingParentProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/.dungeonmaster' });
    proxy.mkdirRejects({ path: '/readonly/.dungeonmaster/event-outbox.jsonl', error });

    await expect(
      appendLinesCreatingParent({
        path: '/readonly/.dungeonmaster/event-outbox.jsonl',
        lines: ['{}'],
      }),
    ).rejects.toBe(error);
  });

  it('ERROR: {append rejects with EISDIR} => rejects with the raw error', async () => {
    const proxy = appendLinesCreatingParentProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/.dungeonmaster' });
    proxy.appendRejects({ path: '/repo/.dungeonmaster', error });

    await expect(
      appendLinesCreatingParent({ path: '/repo/.dungeonmaster', lines: ['{}'] }),
    ).rejects.toBe(error);
  });

  it('VALID: {two calls to the same path} => getCallsFor reads back each append call in order', async () => {
    const proxy = appendLinesCreatingParentProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/event-outbox.jsonl' });

    await appendLinesCreatingParent({
      path: '/repo/.dungeonmaster/event-outbox.jsonl',
      lines: ['{"a":1}'],
    });
    await appendLinesCreatingParent({
      path: '/repo/.dungeonmaster/event-outbox.jsonl',
      lines: ['{"a":2}'],
    });

    expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/event-outbox.jsonl' })).toStrictEqual([
      ['/repo/.dungeonmaster/event-outbox.jsonl', '{"a":1}\n', 'utf8'],
      ['/repo/.dungeonmaster/event-outbox.jsonl', '{"a":2}\n', 'utf8'],
    ]);
  });
});
