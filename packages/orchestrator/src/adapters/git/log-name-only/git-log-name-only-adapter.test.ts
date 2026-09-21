import { AbsoluteFilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { gitLogNameOnlyAdapter } from './git-log-name-only-adapter';
import { gitLogNameOnlyAdapterProxy } from './git-log-name-only-adapter.proxy';

const RS = '\u001e';
const US = '\u001f';
const SHA_ONE = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
const SHA_TWO = 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1';

describe('gitLogNameOnlyAdapter', () => {
  describe('the structured body line', () => {
    it('VALID: {a body carrying "work items:"} => scope is read off that line', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({
        output: `${RS}${SHA_ONE}${US}codeweaver/work: the badge reads off the list${US}work items: pc-scan, pc-render\n${US}\npackages/web/src/a.ts\npackages/web/src/a.test.ts\n`,
      });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([
        {
          sha: SHA_ONE,
          scope: 'pc-scan, pc-render',
          subject: 'codeweaver/work: the badge reads off the list',
          paths: ['packages/web/src/a.ts', 'packages/web/src/a.test.ts'],
        },
      ]);
    });

    it('VALID: {a prose subject and no body line} => scope is null rather than parsed off the subject', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({
        output: `${RS}${SHA_ONE}${US}codeweaver: the badge reads off the persisted list${US}Closes the gap the walk found.\n${US}\npackages/web/src/a.ts\n`,
      });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([
        {
          sha: SHA_ONE,
          scope: null,
          subject: 'codeweaver: the badge reads off the persisted list',
          paths: ['packages/web/src/a.ts'],
        },
      ]);
    });

    it('EDGE: {a multi-line body} => the paths block survives, because the separators are not newlines', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({
        output: `${RS}${SHA_ONE}${US}reviewer: swept the tree${US}line one\nline two\nwork items: pc-sweep\nline four\n${US}\npackages/web/src/a.ts\n`,
      });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([
        {
          sha: SHA_ONE,
          scope: 'pc-sweep',
          subject: 'reviewer: swept the tree',
          paths: ['packages/web/src/a.ts'],
        },
      ]);
    });
  });

  describe('several commits', () => {
    it('VALID: {two commits} => both come back in git order, each with its own paths', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({
        output:
          `${RS}${SHA_ONE}${US}codeweaver: second${US}work items: pc-two\n${US}\npackages/web/src/b.ts\n` +
          `${RS}${SHA_TWO}${US}codeweaver: first${US}work items: pc-one\n${US}\npackages/shared/src/a.ts\n`,
      });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([
        {
          sha: SHA_ONE,
          scope: 'pc-two',
          subject: 'codeweaver: second',
          paths: ['packages/web/src/b.ts'],
        },
        {
          sha: SHA_TWO,
          scope: 'pc-one',
          subject: 'codeweaver: first',
          paths: ['packages/shared/src/a.ts'],
        },
      ]);
    });

    it('EDGE: {a commit that touched no file} => it still comes back, with an empty path list', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({
        output: `${RS}${SHA_ONE}${US}reviewer: allow-empty, nothing changed${US}${US}\n`,
      });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([
        {
          sha: SHA_ONE,
          scope: null,
          subject: 'reviewer: allow-empty, nothing changed',
          paths: [],
        },
      ]);
    });
  });

  describe('the invocation', () => {
    it('VALID: {cwd, baseRef} => git is spawned with --name-only over baseRef..HEAD in that cwd', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({ output: '' });

      await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        'log',
        '--name-only',
        '--format=%x1e%H%x1f%s%x1f%b%x1f',
        'a1b2c3d4..HEAD',
      ]);
      expect(proxy.getSpawnedCwd()).toBe('/project');
    });
  });

  describe('empty and failing reads', () => {
    it('EMPTY: {no commits since baseRef} => returns []', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupLogOutput({ output: '' });

      const result = await gitLogNameOnlyAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
      });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {git exits non-zero} => throws naming the range and the exit code', async () => {
      const proxy = gitLogNameOnlyAdapterProxy();
      proxy.setupFailure({ output: "fatal: bad revision 'a1b2c3d4..HEAD'" });

      await expect(
        gitLogNameOnlyAdapter({
          cwd: AbsoluteFilePathStub({ value: '/project' }),
          baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
        }),
      ).rejects.toThrow(/git log a1b2c3d4\.\.HEAD --name-only failed with exit code 128/u);
    });
  });
});
