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
});
