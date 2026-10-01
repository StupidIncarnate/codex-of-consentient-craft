import { threadId } from 'worker_threads';
import { writeFileAtomicSync } from './write-file-atomic-sync';
import { writeFileAtomicSyncProxy } from './write-file-atomic-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

const TMP_SUFFIX = `.${String(process.pid)}-${String(threadId)}.tmp`;

describe('writeFileAtomicSync', () => {
  it('VALID: {path, contents} => creates the parent, writes the temp sibling, renames it onto path', () => {
    const proxy = writeFileAtomicSyncProxy();
    proxy.succeeds({ path: '/repo/cache/shard.json' });

    writeFileAtomicSync('/repo/cache/shard.json', '{"a":1}');

    expect({
      mkdir: proxy.getCallsFor({ seam: 'mkdirSync', path: '/repo/cache/shard.json' }),
      write: proxy.getCallsFor({ seam: 'writeFileSync', path: '/repo/cache/shard.json' }),
      rename: proxy.getCallsFor({ seam: 'renameSync', path: '/repo/cache/shard.json' }),
      unlink: proxy.getCallsFor({ seam: 'unlinkSync', path: '/repo/cache/shard.json' }),
    }).toStrictEqual({
      mkdir: [['/repo/cache', { recursive: true }]],
      write: [[`/repo/cache/shard.json${TMP_SUFFIX}`, '{"a":1}', 'utf8']],
      rename: [[`/repo/cache/shard.json${TMP_SUFFIX}`, '/repo/cache/shard.json']],
      unlink: [],
    });
  });

  it('VALID: {succeedsMatchingPath a cache folder} => writtenContents reads back what landed there', () => {
    const proxy = writeFileAtomicSyncProxy();
    proxy.succeedsMatchingPath({
      path: (value: unknown): boolean => String(value).startsWith('/repo/cache'),
    });

    writeFileAtomicSync('/repo/cache/a/b.json', '{"b":2}');

    expect(proxy.writtenContents({ path: '/repo/cache/a/b.json' })).toBe('{"b":2}');
  });

  it('ERROR: {temp write throws ENOSPC} => removes the temp sibling and throws the write error', () => {
    const proxy = writeFileAtomicSyncProxy();
    const error = FsErrorStub({ code: 'ENOSPC', path: `/repo/cache/shard.json${TMP_SUFFIX}` });
    proxy.writeThrows({ path: '/repo/cache/shard.json', error });

    expect(() => {
      writeFileAtomicSync('/repo/cache/shard.json', '{}');
    }).toThrow(error);
    expect(proxy.getCallsFor({ seam: 'unlinkSync', path: '/repo/cache/shard.json' })).toStrictEqual(
      [[`/repo/cache/shard.json${TMP_SUFFIX}`]],
    );
  });

  it('ERROR: {rename throws EXDEV} => removes the temp sibling and throws the rename error', () => {
    const proxy = writeFileAtomicSyncProxy();
    const error = FsErrorStub({ code: 'EXDEV', path: `/repo/cache/shard.json${TMP_SUFFIX}` });
    proxy.renameThrows({ path: '/repo/cache/shard.json', error });

    expect(() => {
      writeFileAtomicSync('/repo/cache/shard.json', '{}');
    }).toThrow(error);
    expect(proxy.getCallsFor({ seam: 'unlinkSync', path: '/repo/cache/shard.json' })).toStrictEqual(
      [[`/repo/cache/shard.json${TMP_SUFFIX}`]],
    );
  });

  it('ERROR: {rename throws, cleanup unlink throws ENOENT} => throws the rename error', () => {
    const proxy = writeFileAtomicSyncProxy();
    const renameError = FsErrorStub({ code: 'EXDEV', path: '/repo/cache/shard.json' });
    const unlinkError = FsErrorStub({ code: 'ENOENT', path: '/repo/cache/shard.json' });
    proxy.renameThrowsThenUnlinkThrows({
      path: '/repo/cache/shard.json',
      renameError,
      unlinkError,
    });

    expect(() => {
      writeFileAtomicSync('/repo/cache/shard.json', '{}');
    }).toThrow(renameError);
  });

  it('ERROR: {rename throws, cleanup unlink throws EACCES} => throws the cleanup error', () => {
    const proxy = writeFileAtomicSyncProxy();
    const renameError = FsErrorStub({ code: 'EXDEV', path: '/repo/cache/shard.json' });
    const unlinkError = FsErrorStub({ code: 'EACCES', path: '/repo/cache/shard.json' });
    proxy.renameThrowsThenUnlinkThrows({
      path: '/repo/cache/shard.json',
      renameError,
      unlinkError,
    });

    expect(() => {
      writeFileAtomicSync('/repo/cache/shard.json', '{}');
    }).toThrow(unlinkError);
  });
});
