import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

import { ESLint } from '../eslint';
import { ESLintProxy } from './eslint.proxy';

const CLEAN_RESULT = {
  filePath: '/repo/a.ts',
  messages: [],
  suppressedMessages: [],
  errorCount: 0,
  fatalErrorCount: 0,
  warningCount: 0,
  fixableErrorCount: 0,
  fixableWarningCount: 0,
  usedDeprecatedRules: [],
};
const DIRTY_RESULT = {
  ...CLEAN_RESULT,
  filePath: '/repo/b.ts',
  messages: [
    { ruleId: 'no-console', severity: 2 as const, message: 'No console', line: 1, column: 1 },
  ],
  errorCount: 1,
};

describe('ESLintProxy', () => {
  describe('construction', () => {
    it('ERROR: {constructionThrows for a cwd} => new ESLint with that cwd throws the staged error', () => {
      const proxy = ESLintProxy();
      proxy.constructionThrows({ cwd: '/broken', error: new Error('bad options') });

      expect(() => new ESLint({ cwd: '/broken' })).toThrow(/^bad options$/u);
    });

    it('ERROR: {constructionThrows for one cwd} => a construction with another cwd throws as unstaged', () => {
      const proxy = ESLintProxy();
      proxy.constructionThrows({ cwd: '/broken', error: new Error('bad options') });

      expect(() => new ESLint({ cwd: '/fine' })).toThrow(
        /^registerMock: nothing set up for the call ESLint\(\{"cwd":"\/fine"\}\)\. Calls that ARE set up: \(\{"cwd":"\/broken"\}\)$/u,
      );
    });
  });

  describe('lintText', () => {
    it('VALID: {text, filePath} staged => resolves the staged results for that pair', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({
        text: 'const a = 1;',
        filePath: '/repo/a.ts',
        results: [CLEAN_RESULT],
      });

      const results = await new ESLint({ cwd: '/repo' }).lintText('const a = 1;', {
        filePath: '/repo/a.ts',
      });

      expect(results).toStrictEqual([CLEAN_RESULT]);
    });

    it('VALID: {text only} staged => answers a call carrying any filePath', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({ text: 'console.log(1);', results: [DIRTY_RESULT] });

      const results = await new ESLint({ cwd: '/repo' }).lintText('console.log(1);', {
        filePath: '/anywhere/x.ts',
      });

      expect(results).toStrictEqual([DIRTY_RESULT]);
    });

    it('VALID: {two texts staged} => each text gets its own results', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({ text: 'clean', results: [CLEAN_RESULT] });
      proxy.lintTextReturns({ text: 'dirty', results: [DIRTY_RESULT] });
      const eslint = new ESLint({ cwd: '/repo' });

      const clean = await eslint.lintText('clean');
      const dirty = await eslint.lintText('dirty');

      expect({ clean, dirty }).toStrictEqual({ clean: [CLEAN_RESULT], dirty: [DIRTY_RESULT] });
    });

    it('VALID: {text predicate excluding one text} => answers every other text', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({ text: 'old', results: [CLEAN_RESULT] });
      proxy.lintTextReturns({ text: (value: unknown) => value !== 'old', results: [DIRTY_RESULT] });
      const eslint = new ESLint({ cwd: '/repo' });

      const oldResults = await eslint.lintText('old');
      const newResults = await eslint.lintText('something else');

      expect({ oldResults, newResults }).toStrictEqual({
        oldResults: [CLEAN_RESULT],
        newResults: [DIRTY_RESULT],
      });
    });

    it('ERROR: {filePath differs from the staged one} => the unstaged call throws, no default answer', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({ text: 'x', filePath: '/repo/a.ts', results: [CLEAN_RESULT] });

      await expect(
        Promise.resolve().then(async () =>
          new ESLint({ cwd: '/repo' }).lintText('x', { filePath: '/repo/other.ts' }),
        ),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call lintText\("x", \{"filePath":"\/repo\/other\.ts"\}\)\. Calls that ARE set up: \("x", \{"filePath":"\/repo\/a\.ts"\}\)$/u,
      );
    });

    it('ERROR: {nothing staged} => the call throws', async () => {
      ESLintProxy();

      await expect(
        Promise.resolve().then(async () => new ESLint({ cwd: '/repo' }).lintText('x')),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call lintText\("x"\)\. Calls that ARE set up: $/u,
      );
    });

    it('ERROR: {lintTextRejects} => rejects with the staged error', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextRejects({ text: 'boom', error: new Error('parse failed') });

      await expect(new ESLint({ cwd: '/repo' }).lintText('boom')).rejects.toThrow(
        /^parse failed$/u,
      );
    });

    it('VALID: {calls made} => getLintTextCallsFor returns the full argument tuples for that text', async () => {
      const proxy = ESLintProxy();
      proxy.lintTextReturns({ text: 'a', results: [CLEAN_RESULT] });
      proxy.lintTextReturns({ text: 'b', results: [CLEAN_RESULT] });
      const eslint = new ESLint({ cwd: '/repo' });

      await eslint.lintText('a', { filePath: '/repo/one.ts' });
      await eslint.lintText('b', { filePath: '/repo/two.ts' });
      await eslint.lintText('a', { filePath: '/repo/three.ts' });

      expect(proxy.getLintTextCallsFor({ text: 'a' })).toStrictEqual([
        ['a', { filePath: '/repo/one.ts' }],
        ['a', { filePath: '/repo/three.ts' }],
      ]);
    });
  });

  describe('lintFiles', () => {
    it('VALID: {files} staged => resolves the staged results for exactly that list', async () => {
      const proxy = ESLintProxy();
      proxy.lintFilesReturns({ files: ['/repo/a.ts'], results: [CLEAN_RESULT] });
      proxy.lintFilesReturns({ files: ['/repo/b.ts'], results: [DIRTY_RESULT] });

      const results = await new ESLint({ cwd: '/repo' }).lintFiles(['/repo/b.ts']);

      expect(results).toStrictEqual([DIRTY_RESULT]);
    });

    it('ERROR: {a different list} => throws, no default answer', async () => {
      const proxy = ESLintProxy();
      proxy.lintFilesReturns({ files: ['/repo/a.ts'], results: [CLEAN_RESULT] });

      await expect(
        Promise.resolve().then(async () =>
          new ESLint({ cwd: '/repo' }).lintFiles(['/repo/zzz.ts']),
        ),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call lintFiles\(\["\/repo\/zzz\.ts"\]\)\. Calls that ARE set up: \(\["\/repo\/a\.ts"\]\)$/u,
      );
    });

    it('ERROR: {lintFilesRejects} => rejects with the staged error', async () => {
      const proxy = ESLintProxy();
      proxy.lintFilesRejects({
        files: ['/repo/a.ts'],
        error: FileMissingErrorStub({ path: '/repo/a.ts' }),
      });

      await expect(new ESLint({ cwd: '/repo' }).lintFiles(['/repo/a.ts'])).rejects.toThrow(
        /^ENOENT: open '\/repo\/a\.ts'$/u,
      );
    });

    it('VALID: {calls made} => getLintFilesCallsFor returns the argument tuples for that list', async () => {
      const proxy = ESLintProxy();
      proxy.lintFilesReturns({ files: ['/repo/a.ts'], results: [CLEAN_RESULT] });
      proxy.lintFilesReturns({ files: ['/repo/b.ts'], results: [CLEAN_RESULT] });
      const eslint = new ESLint({ cwd: '/repo' });

      await eslint.lintFiles(['/repo/a.ts']);
      await eslint.lintFiles(['/repo/b.ts']);

      expect(proxy.getLintFilesCallsFor({ files: ['/repo/b.ts'] })).toStrictEqual([
        [['/repo/b.ts']],
      ]);
    });
  });

  describe('outputFixes', () => {
    it('VALID: {results staged} => resolves and records the results it was given', async () => {
      const proxy = ESLintProxy();
      proxy.outputFixesResolves({ results: [DIRTY_RESULT] });

      await ESLint.outputFixes([DIRTY_RESULT]);

      expect(proxy.getOutputFixesCallsFor({ results: [DIRTY_RESULT] })).toStrictEqual([
        [[DIRTY_RESULT]],
      ]);
    });

    it('ERROR: {results never staged} => throws, no default answer', async () => {
      const proxy = ESLintProxy();
      proxy.outputFixesResolves({ results: [CLEAN_RESULT] });

      await expect(
        Promise.resolve().then(async () => ESLint.outputFixes([DIRTY_RESULT])),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call outputFixes\(\[\{"filePath":"\/repo\/b\.ts".*Calls that ARE set up: \(\[\{"filePath":"\/repo\/a\.ts".*$/u,
      );
    });

    it('ERROR: {outputFixesRejects} => rejects with the staged error', async () => {
      const proxy = ESLintProxy();
      proxy.outputFixesRejects({ results: [DIRTY_RESULT], error: new Error('disk full') });

      await expect(ESLint.outputFixes([DIRTY_RESULT])).rejects.toThrow(/^disk full$/u);
    });
  });

  describe('isPathIgnored', () => {
    it('VALID: {two paths staged} => each path answers its own boolean', async () => {
      const proxy = ESLintProxy();
      proxy.isPathIgnoredReturns({ filePath: '/repo/fixture.ts', ignored: true });
      proxy.isPathIgnoredReturns({ filePath: '/repo/src.ts', ignored: false });
      const eslint = new ESLint({ cwd: '/repo' });

      const fixture = await eslint.isPathIgnored('/repo/fixture.ts');
      const src = await eslint.isPathIgnored('/repo/src.ts');

      expect({ fixture, src }).toStrictEqual({ fixture: true, src: false });
    });

    it('ERROR: {unstaged path} => throws, no default answer', async () => {
      const proxy = ESLintProxy();
      proxy.isPathIgnoredReturns({ filePath: '/repo/fixture.ts', ignored: true });

      await expect(
        Promise.resolve().then(async () =>
          new ESLint({ cwd: '/repo' }).isPathIgnored('/repo/other.ts'),
        ),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call isPathIgnored\("\/repo\/other\.ts"\)\. Calls that ARE set up: \("\/repo\/fixture\.ts"\)$/u,
      );
    });

    it('ERROR: {isPathIgnoredRejects} => rejects with the staged error', async () => {
      const proxy = ESLintProxy();
      proxy.isPathIgnoredRejects({ filePath: '/outside.ts', error: new Error('outside cwd') });

      await expect(new ESLint({ cwd: '/repo' }).isPathIgnored('/outside.ts')).rejects.toThrow(
        /^outside cwd$/u,
      );
    });

    it('VALID: {calls made} => getIsPathIgnoredCallsFor returns the argument tuples for that path', async () => {
      const proxy = ESLintProxy();
      proxy.isPathIgnoredReturns({ filePath: '/repo/a.ts', ignored: false });
      proxy.isPathIgnoredReturns({ filePath: '/repo/b.ts', ignored: false });
      const eslint = new ESLint({ cwd: '/repo' });

      await eslint.isPathIgnored('/repo/a.ts');
      await eslint.isPathIgnored('/repo/b.ts');

      expect(proxy.getIsPathIgnoredCallsFor({ filePath: '/repo/a.ts' })).toStrictEqual([
        ['/repo/a.ts'],
      ]);
    });
  });

  describe('calculateConfigForFile', () => {
    it('VALID: {config staged for a path} => resolves that config for that path only', async () => {
      const proxy = ESLintProxy();
      proxy.calculateConfigForFileReturns({
        filePath: '/repo/a.ts',
        config: { rules: { 'no-console': 'warn' } },
      });
      proxy.calculateConfigForFileReturns({
        filePath: '/repo/b.ts',
        config: { rules: { 'no-undef': 'error' } },
      });
      const eslint = new ESLint({ cwd: '/repo' });

      const configA = await eslint.calculateConfigForFile('/repo/a.ts');
      const configB = await eslint.calculateConfigForFile('/repo/b.ts');

      expect({ configA, configB }).toStrictEqual({
        configA: { rules: { 'no-console': 'warn' } },
        configB: { rules: { 'no-undef': 'error' } },
      });
    });

    it('EMPTY: {null config staged} => resolves null, the value ESLint returns for an ignored file', async () => {
      const proxy = ESLintProxy();
      proxy.calculateConfigForFileReturns({ filePath: '/repo/ignored.ts', config: null });

      const config = await new ESLint({ cwd: '/repo' }).calculateConfigForFile('/repo/ignored.ts');

      expect(config).toBe(null);
    });

    it('ERROR: {unstaged path} => throws, no default answer', async () => {
      const proxy = ESLintProxy();
      proxy.calculateConfigForFileReturns({ filePath: '/repo/a.ts', config: null });

      await expect(
        Promise.resolve().then(async () =>
          new ESLint({ cwd: '/repo' }).calculateConfigForFile('/repo/other.ts'),
        ),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call calculateConfigForFile\("\/repo\/other\.ts"\)\. Calls that ARE set up: \("\/repo\/a\.ts"\)$/u,
      );
    });

    it('ERROR: {calculateConfigForFileRejects} => rejects with the staged error', async () => {
      const proxy = ESLintProxy();
      proxy.calculateConfigForFileRejects({
        filePath: '/repo/bad.ts',
        error: new Error('bad config'),
      });

      await expect(
        new ESLint({ cwd: '/repo' }).calculateConfigForFile('/repo/bad.ts'),
      ).rejects.toThrow(/^bad config$/u);
    });

    it('VALID: {calls made} => getCalculateConfigForFileCallsFor returns the argument tuples for that path', async () => {
      const proxy = ESLintProxy();
      proxy.calculateConfigForFileReturns({ filePath: '/repo/a.ts', config: null });
      proxy.calculateConfigForFileReturns({ filePath: '/repo/b.ts', config: null });
      const eslint = new ESLint({ cwd: '/repo' });

      await eslint.calculateConfigForFile('/repo/a.ts');
      await eslint.calculateConfigForFile('/repo/b.ts');

      expect(proxy.getCalculateConfigForFileCallsFor({ filePath: '/repo/b.ts' })).toStrictEqual([
        ['/repo/b.ts'],
      ]);
    });
  });
});
