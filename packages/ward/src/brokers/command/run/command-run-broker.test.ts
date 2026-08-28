import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';
import { fileScopeEmptyStatics } from '../../../statics/file-scope-empty/file-scope-empty-statics';
import { noFilesProcessedStatics } from '../../../statics/no-files-processed/no-files-processed-statics';
import { pathNotFoundStatics } from '../../../statics/path-not-found/path-not-found-statics';

import { commandRunBroker } from './command-run-broker';
import { commandRunBrokerProxy } from './command-run-broker.proxy';

describe('commandRunBroker', () => {
  // AN EMPTY FILE SCOPE IS NOT AN ABSENT ONE. `commandRunLayerGitScopeBroker` leaves `passthrough`
  // unset when the diff holds no source file, and every consumer downstream reads unset as "no file
  // scope" — so the run graded the whole monorepo. On quest a7520e60 both round reviewers hit it
  // moments after pushing their own round: `--staged` had nothing left to measure and swept all 13
  // packages including e2e, 858s on one and past the 600s harness timeout on the other, and both
  // reported that wide green as the round's verdict.
  //
  // Each case stages the single-package PASS path deliberately. Those mocks describe the whole-repo
  // run, so before the short-circuit existed this test failed on the summary line it wrote rather
  // than on an unstaged call — the assertion bites on what ward DID, not on what it reached for.
  describe('file scope that resolves to nothing', () => {
    it('EMPTY: {staged: true, nothing unpushed} => runs no checks and says the scope is empty', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();
      proxy.setupStagedWithNothingUnpushed();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ staged: true });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutCalls: [`${fileScopeEmptyStatics.message}\n`],
        exitCode: 0,
        exitCalls: [],
      });
    });

    it('EMPTY: {changed: true, nothing changed} => runs no checks and says the scope is empty', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();
      proxy.setupChangedWithNothingChanged();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ changed: true });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutCalls: [`${fileScopeEmptyStatics.message}\n`],
        exitCode: 0,
        exitCalls: [],
      });
    });

    // The SAME empty scope arriving from the other file-scoping input. `passthrough: []` is a file
    // list that resolved to nothing, and `hasPassthrough` — `Array.isArray(x) && x.length > 0` in
    // five separate places — reads it identically to an unset one, which is the whole repo. Nothing
    // about that hazard is specific to the two git flags, so the short-circuit may not be either.
    it('EMPTY: {passthrough: []} => runs no checks and says the file scope is empty', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ passthrough: [] });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutCalls: [`${fileScopeEmptyStatics.message}\n`],
        exitCode: 0,
        exitCalls: [],
      });
    });

    // The complement, and the reason the short-circuit reads `passthrough` rather than the flag: a
    // git scope that DID resolve to files is an ordinary scoped run and must still execute.
    it('VALID: {staged: true, one unpushed source file} => runs the checks instead of short-circuiting', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();
      proxy.setupStagedWithOneUnpushedFile();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ staged: true });

      await commandRunBroker({ config, rootPath });

      expect(proxy.getStdoutCalls()[0]).toBe(
        [
          'run: 1739625600000-a38e',
          'lint:      WARN  0 files run',
          'typecheck: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'integration: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          '',
        ].join('\n'),
      );
    });
  });

  // A PATH DISK DOES NOT HAVE IS THE CALLER BEING WRONG, and it is a different answer from an empty
  // git scope. `--staged` with nothing unpushed legitimately has nothing to check and exits 0; a
  // typo'd `-- <file>` asked for something specific and got silence. Reproduced live before this
  // existed: `npm run ward -- --only lint -- packages/definitely-not-a-package/src/nope.ts` printed
  // `lint: WARN 0 files run` and exited 0, because the path matched no package, spawned no child,
  // and `checkResultBuildTransformer` reads an EMPTY projectResults as `pass` rather than `skip`.
  describe('file scope naming a path that is not on disk', () => {
    it('ERROR: {passthrough names a missing path} => runs no checks and exits non-zero', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();
      proxy.setupMissingPath({
        filePath: FilePathStub({ value: '/project/packages/wardd/src/typo.ts' }),
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ passthrough: ['packages/wardd/src/typo.ts'] });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutCalls: [
          `${pathNotFoundStatics.heading}\n  packages/wardd/src/typo.ts\n\n${pathNotFoundStatics.guidance}\n`,
        ],
        exitCode: 1,
        exitCalls: [],
      });
    });
  });

  // A PATH THAT RESOLVED AND WAS STILL NEVER LOOKED AT is the third silence, and it is not either of
  // the two above. `pathNotFoundStatics` speaks for disk not having the name; `fileScopeEmptyStatics`
  // speaks for a scope that resolved to no paths at all. This one is the caller naming a real file
  // that every file-scoped check then declined: reproduced live as
  // `npm run ward -- --only lint -- scripts/build-workspaces.mjs`, which printed
  // `lint: WARN 0 files run` at exit 0 because `scripts/**` sits in eslint.config.js `ignores` and
  // belongs to no workspace package.
  describe('caller-typed file scope that no check processed', () => {
    it('ERROR: {passthrough names a real path, lint reports 0 files} => exits non-zero and names the path', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackageLintPassWithNoFiles();
      proxy.setupExistingPath({ filePath: FilePathStub({ value: '/project/src/index.ts' }) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'], passthrough: ['src/index.ts'] });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        stdoutCalls: [
          ['run: 1739625600000-a38e', 'lint:      WARN  0 files run', ''].join('\n'),
          `\n${noFilesProcessedStatics.heading}\n  src/index.ts\n\n${noFilesProcessedStatics.guidance}\n`,
        ],
        exitCode: 1,
        exitCalls: [],
      });
    });

    // THE SCOPE LIMIT, and the reason this reads the config the CALLER handed in rather than the one
    // `commandRunLayerGitScopeBroker` returns — both write the same `passthrough` field. A git diff
    // legitimately holds root-level files nothing lints, so failing here would redden ordinary
    // `--staged` runs. Pinning the WHOLE stdout list is what proves nothing extra was printed.
    it('VALID: {staged: true resolves to a file no check processed} => prints no unprocessed-path guidance', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();
      proxy.setupStagedWithOneUnpushedFile();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ staged: true });

      await commandRunBroker({ config, rootPath });

      expect(proxy.getStdoutCalls()).toStrictEqual([
        [
          'run: 1739625600000-a38e',
          'lint:      WARN  0 files run',
          'typecheck: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'integration: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          '',
        ].join('\n'),
        '\nDISCOVERY MISMATCH — ward discovered files that were not processed (or vice versa). Every test must run; an unrun test is a hidden regression. This run is FAILING until each mismatch below is investigated and resolved at the root cause:\n  - typecheck\n  - unit\n  - integration\n\nFor each check above: read the "only processed" / "only discovered" lines in the summary, then determine WHY discovery and processing diverged (e.g. test runner config drift from ward\'s discovery globs, untyped imports pulling in dist files, files matching a pattern they shouldn\'t, missing config exclusions). Fix the root cause — do not paper over the mismatch by adjusting ward\'s discovery to match the buggy state.\n',
      ]);
    });
  });

  describe('discovery mismatch run', () => {
    it('VALID: {checks discover files but process zero} => sets process.exitCode to 1 with mismatch guidance', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackagePass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      await commandRunBroker({ config, rootPath });

      const stdoutCalls = proxy.getStdoutCalls();

      expect({
        summary: stdoutCalls[0],
        guidance: stdoutCalls[1],
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        summary: [
          'run: 1739625600000-a38e',
          'lint:      WARN  0 files run',
          'typecheck: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'unit:      WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'integration: WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          'e2e:       WARN  0 files run, 1 discovered  DISCOVERY MISMATCH',
          '  only discovered: discovered.ts',
          '',
        ].join('\n'),
        guidance:
          '\nDISCOVERY MISMATCH — ward discovered files that were not processed (or vice versa). Every test must run; an unrun test is a hidden regression. This run is FAILING until each mismatch below is investigated and resolved at the root cause:\n  - typecheck\n  - unit\n  - integration\n  - e2e\n\nFor each check above: read the "only processed" / "only discovered" lines in the summary, then determine WHY discovery and processing diverged (e.g. test runner config drift from ward\'s discovery globs, untyped imports pulling in dist files, files matching a pattern they shouldn\'t, missing config exclusions). Fix the root cause — do not paper over the mismatch by adjusting ward\'s discovery to match the buggy state.\n',
        exitCode: 1,
        exitCalls: [],
      });
    });
  });

  describe('failing run', () => {
    it('VALID: {checks fail with errors} => sets process.exitCode to 1 instead of calling process.exit', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackageFail();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunBroker({ config, rootPath });

      expect({
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        exitCode: 1,
        exitCalls: [],
      });
    });
  });

  describe('--onlyTests across packages', () => {
    it('VALID: {pattern matches one package, misses the rest} => leaves process.exitCode at 0', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupMultiPackageOnlyTests({ matches: ['unmatched', 'matched', 'unmatched'] });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['unit'], onlyTests: 'my specific test' });

      await commandRunBroker({ config, rootPath });

      expect({
        stdoutCalls: proxy.getStdoutCalls(),
        exitCode: process.exitCode,
      }).toStrictEqual({
        stdoutCalls: [
          [
            'run: 1739625600000-a38e',
            'unit:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)',
            '',
          ].join('\n'),
        ],
        exitCode: 0,
      });
    });

    it('VALID: {pattern misses every package} => sets process.exitCode to 1 with typo guidance', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupMultiPackageOnlyTests({ matches: ['unmatched', 'unmatched', 'unmatched'] });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['unit'], onlyTests: 'XYZNONEXISTENT' });

      await commandRunBroker({ config, rootPath });

      const stdoutCalls = proxy.getStdoutCalls();

      expect({
        guidance: stdoutCalls[stdoutCalls.length - 1],
        exitCode: process.exitCode,
      }).toStrictEqual({
        guidance:
          '\n--onlyTests pattern "XYZNONEXISTENT" matched 0 tests in any package — possible typo or stale test name\n',
        exitCode: 1,
      });
    });
  });

  describe('crashed run', () => {
    it('VALID: {check fails with no findings} => sets process.exitCode to 2', async () => {
      process.exitCode = 0;
      const proxy = commandRunBrokerProxy();
      proxy.setupSinglePackageCrash();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunBroker({ config, rootPath });

      expect({
        exitCode: process.exitCode,
        exitCalls: proxy.getExitCalls(),
      }).toStrictEqual({
        exitCode: 2,
        exitCalls: [],
      });
    });
  });
});
