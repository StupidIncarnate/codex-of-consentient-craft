import { logNameOnly } from './git-log-name-only';
import { gitLogNameOnlyProxy } from './git-log-name-only.proxy';

const RECORD_SEP = '\u001e';
const FIELD_SEP = '\u001f';

describe('logNameOnly()', () => {
  it('VALID: {one commit with a scope line} => returns sha, scope, subject, paths', async () => {
    const proxy = gitLogNameOnlyProxy();
    const body = 'work items: op-1, op-2';
    const record = `a1b2c3d4${FIELD_SEP}add auth${FIELD_SEP}${body}${FIELD_SEP}packages/a/file.ts\npackages/b/file.ts\n`;
    proxy.setupResult({ baseRef: 'base', exitCode: 0, output: `${RECORD_SEP}${record}` });

    const result = await logNameOnly({ cwd: '/repo', baseRef: 'base' });

    expect(result).toStrictEqual([
      {
        sha: 'a1b2c3d4',
        scope: 'op-1, op-2',
        subject: 'add auth',
        paths: ['packages/a/file.ts', 'packages/b/file.ts'],
      },
    ]);
  });

  it('EDGE: {commit body with no "work items:" line} => scope is null', async () => {
    const proxy = gitLogNameOnlyProxy();
    const record = `a1b2c3d4${FIELD_SEP}fix typo${FIELD_SEP}manual reviewer prose${FIELD_SEP}packages/a/file.ts\n`;
    proxy.setupResult({ baseRef: 'base', exitCode: 0, output: `${RECORD_SEP}${record}` });

    const result = await logNameOnly({ cwd: '/repo', baseRef: 'base' });

    expect(result).toStrictEqual([
      { sha: 'a1b2c3d4', scope: null, subject: 'fix typo', paths: ['packages/a/file.ts'] },
    ]);
  });

  it('ERROR: {exitCode: 128} => throws naming the command and output', async () => {
    const proxy = gitLogNameOnlyProxy();
    proxy.setupResult({ baseRef: 'base', exitCode: 128, output: 'fatal: bad revision' });

    await expect(logNameOnly({ cwd: '/repo', baseRef: 'base' })).rejects.toStrictEqual(
      new Error('git log base..HEAD --name-only failed with exit code 128: fatal: bad revision'),
    );
  });

  it('EMPTY: {output: ""} => returns an empty array', async () => {
    const proxy = gitLogNameOnlyProxy();
    proxy.setupResult({ baseRef: 'base', exitCode: 0, output: '' });

    const result = await logNameOnly({ cwd: '/repo', baseRef: 'base' });

    expect(result).toStrictEqual([]);
  });
});
