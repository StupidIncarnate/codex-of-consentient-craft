import { setExitCodeProxy } from '#gateway/node/process/set-exit-code/set-exit-code.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { WardRunResultStub } from '../../../contracts/ward-run-result/ward-run-result.stub';
import type { TestNamePatternMatch } from '../../../contracts/test-name-pattern-match/test-name-pattern-match-contract';
import type { PlatformCrossingViolation } from '../../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import { jestCacheStatics } from '../../../statics/jest-cache/jest-cache-statics';
import { jestCachePruneBrokerProxy } from '../../jest-cache/prune/jest-cache-prune-broker.proxy';
import { folderResolveLayerBrokerProxy } from './folder-resolve-layer-broker.proxy';
import { gitScopeLayerBrokerProxy } from './git-scope-layer-broker.proxy';
import { pathCheckLayerBrokerProxy } from './path-check-layer-broker.proxy';
import { singlePackageLayerBrokerProxy } from './single-package-layer-broker.proxy';
import { multiPackageLayerBrokerProxy } from './multi-package-layer-broker.proxy';
import { platformDedupeCheckLayerBrokerProxy } from './platform-dedupe-check-layer-broker.proxy';

// One eslint finding — a genuine red run, as opposed to a check that exits non-zero while
// reporting nothing (the crash shape below).
const LINT_ERROR_REPORT = JSON.stringify([
  {
    filePath: '/project/src/index.ts',
    messages: [
      { ruleId: 'no-explicit-any', severity: 2, message: 'Unexpected any', line: 10, column: 5 },
    ],
  },
]);

const DAY_MS = 86_400_000;

export const commandRunBrokerProxy = (): {
  setupSinglePackagePass: () => void;
  setupSinglePackageLintPassWithNoFiles: () => void;
  setupSinglePackageE2eOnlySkip: () => void;
  setupSinglePackageFail: () => void;
  setupSinglePackageCrash: () => void;
  setupUncommittedWithCleanTree: () => void;
  setupCommittedWithNothingCommitted: () => void;
  setupUncommittedWithOneEditedFile: () => void;
  setupUncommittedWithSurvivingAndDeletedFile: () => void;
  setupUncommittedWithOnlyDeletedFile: () => void;
  setupExistingPath: ({ filePath }: { filePath: string }) => void;
  setupMissingPath: ({ filePath }: { filePath: string }) => void;
  setupCompanionTestMissing: (params: { relativePath: string }) => void;
  setupMultiPackagePass: (params: { packageCount: number; subResultContent: string }) => void;
  setupMultiPackageOnlyTests: (params: { matches: TestNamePatternMatch[] }) => void;
  setupPlatformCrossingViolation: (params: { violation: PlatformCrossingViolation }) => void;
  getStdoutCalls: () => readonly unknown[];
  setupStaleCacheEntry: (params: { name: string }) => void;
  getRemovedCachePaths: () => readonly unknown[];
} => {
  setExitCodeProxy();
  const stdout = stdoutProxy();
  stderrProxy();

  const workspaceProxy = workspaceDiscoverBrokerProxy();
  const gitScopeProxy = gitScopeLayerBrokerProxy();
  const pathCheckProxy = pathCheckLayerBrokerProxy();
  const folderProxy = folderResolveLayerBrokerProxy();
  const singleProxy = singlePackageLayerBrokerProxy();
  const multiProxy = multiPackageLayerBrokerProxy();
  const platformDedupeProxy = platformDedupeCheckLayerBrokerProxy();
  // After singleProxy, whose Date.now pin the jest cache ages are read against.
  const jestCacheProxy = jestCachePruneBrokerProxy();

  // Matches what folderResolveLayerBroker actually returns for rootPath '/project' when
  // folderProxy stages a package.json named 'test-pkg'.
  const singlePackageProjectFolder = ProjectFolderStub({ name: 'test-pkg', path: '/project' });
  // Every scenario in this file runs against this same rootPath, so the platform-crossing and
  // duplicate-install checks stay clean by default — a scenario that wants a violation overrides it
  // below, which is the one call REPLACING this default rather than adding to it (the two checks
  // are staged together; see platformDedupeCheckLayerBrokerProxy's own comment for why).
  const rootPathForPlatformDedupe = '/project';
  platformDedupeProxy.setupClean({ rootPath: rootPathForPlatformDedupe });

  // `checkRunUnitBroker`'s own companion check tries EVERY extension in
  // `tsExtensionsStatics.allExtensions` before giving up, so declaring a source file's colocated
  // test absent means staging all four — a `.some()` that finds only three staged throws on the
  // fourth instead of returning false.
  const stageNoUnitCompanion = ({ relativePath }: { relativePath: string }): void => {
    const base = relativePath.slice(0, relativePath.lastIndexOf('.'));
    for (const ext of ['ts', 'tsx', 'js', 'jsx']) {
      singleProxy.setupUnitCompanionTestMissing({
        projectFolder: singlePackageProjectFolder,
        relativePath: `${base}.test.${ext}`,
      });
    }
  };

  return {
    setupSinglePackagePass: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupAllChecksPass({ projectFolder: singlePackageProjectFolder });
    },
    // ESLint answers `[]` — the shape it really produces for a file list it visited and found
    // nothing to lint in, and the shape behind `lint: WARN 0 files run`. Lint alone, so the summary
    // carries one check line and no discovery mismatch (discoveredCount is 0 too).
    setupSinglePackageLintPassWithNoFiles: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyPass({ projectFolder: singlePackageProjectFolder });
    },
    setupSinglePackageE2eOnlySkip: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupE2eOnlySkip({ projectFolder: singlePackageProjectFolder });
    },
    setupSinglePackageFail: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyFail({
        projectFolder: singlePackageProjectFolder,
        stdout: LINT_ERROR_REPORT,
      });
    },
    setupSinglePackageCrash: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyFail({ projectFolder: singlePackageProjectFolder, stdout: '[]' });
    },
    // git answers with nothing in either reading, which is what a clean working tree reports for
    // `--uncommitted`. Pair it with a pass setup: the run those mocks describe is the whole-repo
    // one this scope must NOT fall through to.
    setupUncommittedWithCleanTree: (): void => {
      gitScopeProxy.setupUncommittedFiles({ trackedOutput: '', untrackedOutput: '' });
    },
    setupCommittedWithNothingCommitted: (): void => {
      gitScopeProxy.setupCommittedFiles({ diffOutput: '' });
    },
    // The working-tree reading resolves to `src/index.ts`, and the path-check layer asks disk about
    // it by absolute path — so the method that produces the path is the one that declares it exists.
    // Splitting those two would leave a caller staging a git diff whose file the next layer then
    // reports missing.
    setupUncommittedWithOneEditedFile: (): void => {
      gitScopeProxy.setupUncommittedFiles({ trackedOutput: 'src/index.ts\n', untrackedOutput: '' });
      pathCheckProxy.setupExistingPath({
        filePath: '/project/src/index.ts',
      });
      stageNoUnitCompanion({ relativePath: 'src/index.ts' });
    },
    // The tracked half names one file still on disk and one this branch's commits touched but a
    // later, uncommitted `rm` removed — the shape `--committed` produces for a file it can only see
    // through history, blind to the working tree that has since deleted it.
    setupUncommittedWithSurvivingAndDeletedFile: (): void => {
      gitScopeProxy.setupUncommittedFiles({
        trackedOutput: 'src/index.ts\nsrc/gone.ts\n',
        untrackedOutput: '',
      });
      pathCheckProxy.setupExistingPath({
        filePath: '/project/src/index.ts',
      });
      pathCheckProxy.setupMissingPath({
        filePath: '/project/src/gone.ts',
      });
      stageNoUnitCompanion({ relativePath: 'src/index.ts' });
    },
    setupUncommittedWithOnlyDeletedFile: (): void => {
      gitScopeProxy.setupUncommittedFiles({ trackedOutput: 'src/gone.ts\n', untrackedOutput: '' });
      pathCheckProxy.setupMissingPath({
        filePath: '/project/src/gone.ts',
      });
    },
    // Address the ABSOLUTE path — `rootPath` joined to the repo-relative arg — because that is what
    // the path-check layer hands the adapter. Everything not named here answers "on disk".
    setupExistingPath: ({ filePath }: { filePath: string }): void => {
      pathCheckProxy.setupExistingPath({ filePath });
    },
    setupMissingPath: ({ filePath }: { filePath: string }): void => {
      pathCheckProxy.setupMissingPath({ filePath });
    },
    // Declares NO colocated unit test for a passthrough source file, project-relative
    // (`relativePath` is the SOURCE file, e.g. `'src/index.ts'` — every `.test.<ext>` candidate
    // gets staged absent, not just one).
    setupCompanionTestMissing: ({ relativePath }: { relativePath: string }): void => {
      stageNoUnitCompanion({ relativePath });
    },
    setupMultiPackagePass: ({
      packageCount,
      subResultContent,
    }: {
      packageCount: number;
      subResultContent: string;
    }): void => {
      const rootPath = '/project';
      const projectFolders = Array.from({ length: packageCount }, () => ProjectFolderStub());
      multiProxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent });
    },
    // One child ward result per workspace package, each reporting whether the run's --onlyTests
    // pattern reached anything in that package. Every child ran unit only, so a package without a
    // matching test comes back as a skip — exactly the shape a real child ward saves.
    setupMultiPackageOnlyTests: ({ matches }: { matches: TestNamePatternMatch[] }): void => {
      const rootPath = '/project';
      const names = matches.map((_, index) => `pkg${String(index)}`);

      workspaceProxy.setupMultiPackage({
        patterns: ['packages/*'],
        dirs: names,
        packageNames: names,
      });

      multiProxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: matches.map((testNamePatternMatch, index) => {
          const name = `pkg${String(index)}`;
          const projectFolder = ProjectFolderStub({ name, path: `/project/packages/${name}` });
          const status = testNamePatternMatch === 'matched' ? 'pass' : 'skip';

          return {
            projectFolder,
            subResultContent: JSON.stringify(
              WardRunResultStub({
                filters: { only: ['unit'] },
                checks: [
                  CheckResultStub({
                    checkType: 'unit',
                    status,
                    projectResults: [
                      ProjectResultStub({
                        projectFolder,
                        status,
                        testNamePatternMatch,
                        filesCount: 1,
                        discoveredCount: 1,
                      }),
                    ],
                  }),
                ],
              }),
            ),
          };
        }),
      });
    },
    // Overrides the clean default staged above for the SAME rootPath — one violation on the
    // platform-crossing side, duplicate-install still clean.
    setupPlatformCrossingViolation: ({
      violation,
    }: {
      violation: PlatformCrossingViolation;
    }): void => {
      platformDedupeProxy.setupViolations({
        rootPath: rootPathForPlatformDedupe,
        platformViolations: [violation],
      });
    },
    // No independent address exists for arbitrary stdout text — flatten via .map() (a real
    // transform over the WHOLE call history, not an unaddressed peek) so callers needing a
    // specific write's text by position (summary vs guidance) can still index the result.
    getStdoutCalls: (): readonly unknown[] => stdout.getWrites(),
    // One stale entry in the default Jest cache directory the prune sweeps (/tmp/jest_rs).
    setupStaleCacheEntry: ({ name }: { name: string }): void => {
      const path = `/tmp/jest_rs/${name}`;
      jestCacheProxy.setupEntries({ cacheDir: '/tmp/jest_rs', entries: [name] });
      jestCacheProxy.setupAge({ path, ageMs: jestCacheStatics.prune.maxAgeMs + DAY_MS });
      jestCacheProxy.setupRemovable({ path });
    },
    getRemovedCachePaths: (): readonly unknown[] => jestCacheProxy.getRemovedPaths(),
  };
};
