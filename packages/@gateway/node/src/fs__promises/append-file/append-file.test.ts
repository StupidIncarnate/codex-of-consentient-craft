import { appendFile } from './append-file';
import { appendFileProxy } from './append-file.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('appendFile', () => {
  it('VALID: {path, contents} => appends the contents and resolves', async () => {
    const proxy = appendFileProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/event-outbox.jsonl' });

    await expect(
      appendFile('/repo/.dungeonmaster/event-outbox.jsonl', '{"type":"quest-modified"}\n'),
    ).resolves.toBe(undefined);
    expect(proxy.appendedContentsFor({ path: '/repo/.dungeonmaster/event-outbox.jsonl' })).toBe(
      '{"type":"quest-modified"}\n',
    );
  });

  it('ERROR: {missing parent folder} => rejects with the raw ENOENT error', async () => {
    const proxy = appendFileProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/event-outbox.jsonl' });
    proxy.rejects({ path: '/missing/event-outbox.jsonl', error });

    await expect(appendFile('/missing/event-outbox.jsonl', '{}\n')).rejects.toBe(error);
  });

  it('ERROR: {no write permission} => rejects with the raw EACCES error', async () => {
    const proxy = appendFileProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/event-outbox.jsonl' });
    proxy.rejects({ path: '/readonly/event-outbox.jsonl', error });

    await expect(appendFile('/readonly/event-outbox.jsonl', '{}\n')).rejects.toBe(error);
  });

  it('ERROR: {path is a directory} => rejects with the raw EISDIR error', async () => {
    const proxy = appendFileProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/.dungeonmaster' });
    proxy.rejects({ path: '/repo/.dungeonmaster', error });

    await expect(appendFile('/repo/.dungeonmaster', '{}\n')).rejects.toBe(error);
  });

  it('VALID: {succeedsMatchingPath with an outbox suffix} => appends to any matching path and reads it back', async () => {
    const proxy = appendFileProxy();
    proxy.succeedsMatchingPath({
      path: (value: unknown) => String(value).endsWith('/outbox.jsonl'),
    });

    await expect(appendFile('/tmp/any-home/outbox.jsonl', 'line\n')).resolves.toBe(undefined);

    expect(proxy.getCallsFor({ path: '/tmp/any-home/outbox.jsonl' })).toStrictEqual([
      ['/tmp/any-home/outbox.jsonl', 'line\n', 'utf8'],
    ]);
  });

  it('ERROR: {succeedsMatchingPath staged first, then an exact rejects} => the exact stage outranks the predicate', async () => {
    const proxy = appendFileProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/outbox.jsonl' });
    proxy.succeedsMatchingPath({
      path: (value: unknown) => String(value).endsWith('/outbox.jsonl'),
    });
    proxy.rejects({ path: '/readonly/outbox.jsonl', error });

    await expect(appendFile('/readonly/outbox.jsonl', '{}\n')).rejects.toBe(error);
    await expect(appendFile('/writable/outbox.jsonl', '{}\n')).resolves.toBe(undefined);
  });

  it('ERROR: {exact rejects staged first, then succeedsMatchingPath} => the exact stage still outranks the predicate', async () => {
    const proxy = appendFileProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/outbox.jsonl' });
    proxy.rejects({ path: '/missing/outbox.jsonl', error });
    proxy.succeedsMatchingPath({
      path: (value: unknown) => String(value).endsWith('/outbox.jsonl'),
    });

    await expect(appendFile('/missing/outbox.jsonl', '{}\n')).rejects.toBe(error);
  });

  it('VALID: {two appends to the same path} => getCallsFor reads back each call in order', async () => {
    const proxy = appendFileProxy();
    proxy.succeeds({ path: '/repo/.dungeonmaster/event-outbox.jsonl' });

    await appendFile('/repo/.dungeonmaster/event-outbox.jsonl', 'first\n');
    await appendFile('/repo/.dungeonmaster/event-outbox.jsonl', 'second\n');

    expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster/event-outbox.jsonl' })).toStrictEqual([
      ['/repo/.dungeonmaster/event-outbox.jsonl', 'first\n', 'utf8'],
      ['/repo/.dungeonmaster/event-outbox.jsonl', 'second\n', 'utf8'],
    ]);
  });
});
