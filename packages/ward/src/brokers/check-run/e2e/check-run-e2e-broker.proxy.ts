import { architecturePackageE2eEligibleDetectBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/package-e2e-eligible-detect/architecture-package-e2e-eligible-detect-broker.proxy';
import { portKillListenersBrokerProxy } from '@dungeonmaster/shared/brokers/port/kill-listeners/port-kill-listeners-broker.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { freePortPairProxy } from '#gateway/node/net/free-port-pair/free-port-pair.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';

import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { tmpdirFindBrokerProxy } from '../../tmpdir/find/tmpdir-find-broker.proxy';
import { e2eArtifactsRemoveBrokerProxy } from '../../e2e-artifacts/remove/e2e-artifacts-remove-broker.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { bundleBuildBrokerProxy } from '../../bundle/build/bundle-build-broker.proxy';
import { sourceConditionSupportedBrokerProxy } from '../../source-condition/supported/source-condition-supported-broker.proxy';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

// The sha-256 of the three files bundleBuildBrokerProxy's single-package fixture stages, in sorted
// path order relative to the package root. Editing any of those contents changes this number.
const BUNDLE_HASH = '1d36195dbed4d762ee44bad0c0a391b267a8b412c2832995e82a59b16fe9d184';

export const checkRunE2eBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithBundle: (params: { projectFolder: ProjectFolder }) => void;
  getBundleDir: (params: { projectFolder: ProjectFolder }) => string;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupPassWithJsonReport: (params: { projectFolder: ProjectFolder; jsonContent: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFailWithEmptyOutput: (params: { projectFolder: ProjectFolder }) => void;
  setupNotE2eEligible: (params: { projectFolder: ProjectFolder }) => void;
  setupEligibleMissingConfig: (params: { projectFolder: ProjectFolder }) => void;
  setupSourceConditionUnsupported: (params: { projectFolder: ProjectFolder }) => void;
  getRemovedCachePaths: (params: { projectFolder: ProjectFolder }) => readonly unknown[][];
  getSpawnedArgs: () => unknown;
  getSpawnedEnvValue: (params: { key: string }) => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  const existsProxy = existsSyncProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();
  const freePortProxy = freePortPairProxy();
  // e2e discovery has exactly one static pattern (checkCommandsStatics.e2e.discoverPatterns),
  // unlike unit/integration which loop over a dozen. The pattern is known, so key on it exactly.
  const globProxy = globDiscoverFilesBrokerProxy();
  globProxy.returnsForPattern({ pattern: '**/*.e2e.ts', files: ['discovered.ts'] });
  const portKillProxy = portKillListenersBrokerProxy();
  const readProxy = readFileProxy();
  const tmpdirProxy = tmpdirFindBrokerProxy();
  tmpdirProxy.returns({ path: '/tmp' });
  // Unstaged: unlink's return value is discarded by the broker (it deletes the playwright json
  // report best-effort, under a try/catch that ignores the outcome either way), so there is no
  // address worth describing here — the gateway proxy has no catch-all stage, so an unaddressed
  // call throws "nothing set up for this call" exactly as the old adapter proxy's own unaddressed
  // mock did, and the broker's own try/catch swallows it either way.
  unlinkProxy();
  // The broker discards this result and swallows its own errors, so nothing here needs staging for
  // the run to work. It IS staged, because the removal is behaviour worth asserting: the port it
  // deletes under, and that it still fires on the early-return path below.
  const removeProxy = e2eArtifactsRemoveBrokerProxy();
  const binProxy = binResolveBrokerProxy();
  // Every setup below except setupPassWithBundle leaves the bundle broker's own manifest read
  // UNSTAGED, so it answers "no build script" and the run gets no bundle — which is what those
  // setups' expectations describe.
  const bundleProxy = bundleBuildBrokerProxy();
  // The resolved bin path depends on projectFolder.path, so the getters below (which take no
  // params) address the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: string } = { value: '/project/node_modules/.bin/eslint' };
  // `sourceConditionSupportedBroker` walks every ancestor of the cwd, so "reachable" is staged per
  // cwd in `setupPlaywrightConfigExists`; a cwd `setupSourceConditionUnsupported` marked keeps that
  // answer whichever order the two setups are called in.
  const sourceConditionProxy = sourceConditionSupportedBrokerProxy();
  const unsupportedCwds = new Set<string>();

  // The broker names its Playwright report AND its vite cache after the SERVER port, so this
  // number, the readFile address in setupPassWithJsonReport, and the removal staged below all have
  // to move together.
  const STAGED_SERVER_PORT = 40_000;
  const STAGED_WEB_PORT = 51_244;

  // Playwright's own leak surface, checked unconditionally (no `wantsTimerWatch` gate the way
  // unit/integration have — every e2e run asks). Staged by exact path — no wildcard — since no
  // test here stages a leak report; default absent is what every one of them needs.
  const handleReportPath = openHandleReportPathTransformer({
    tmpdir: '/tmp',
    checkType: 'e2e',
    processId: STAGED_SERVER_PORT,
  });
  existsProxy.returns({ path: handleReportPath, exists: false });

  const queueFreePorts = (): void => {
    freePortProxy.returns({ server: STAGED_SERVER_PORT, web: STAGED_WEB_PORT });
    // The post-run teardown always sweeps both ports; every setup below reaches it, so both are
    // staged "nothing listening" here rather than at each call site. KNOWN GATEWAY GAP (see this
    // file's CLAUDE.md-adjacent report under A03/DECISIONS): portKillListenersBrokerProxy composes
    // #gateway/bin's listeningPidsProxy/killPidProxy, which mock `run` DIRECTLY — replacing its real
    // body outright, so the playwright `run.setupSuccess` staged elsewhere in this file (mocking
    // `spawn`, one level below `run`, and relying on `run`'s real body to reach it) never fires once
    // this constructs. There is no address-level fix; the two mock levels cannot coexist.
    portKillProxy.setupNoneListening({ port: STAGED_SERVER_PORT });
    portKillProxy.setupNoneListening({ port: STAGED_WEB_PORT });
  };

  const stageCacheRemoval = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    removeProxy.setupRemovable({
      packageRoot: projectFolder.path,
      port: STAGED_SERVER_PORT,
    });
  };

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): string => {
    const command = binProxy.setupFound({
      cwd: projectFolder.path,
      binName: checkCommandsStatics.e2e.bin,
    });
    resolvedCommandRef.value = command;
    return command;
  };

  const markEligible = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    eligibleProxy.setupPackage({
      packageRoot: String(projectFolder.path),
      srcDirNames: ['widgets'],
      packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
    });
  };

  const setupPlaywrightConfigExists = ({
    projectFolder,
  }: {
    projectFolder: ProjectFolder;
  }): void => {
    markEligible({ projectFolder });
    existsProxy.returns({
      path: `${projectFolder.path}/playwright.config.ts`,
      exists: true,
    });
    const cwd = projectFolder.path;
    if (!unsupportedCwds.has(cwd)) {
      sourceConditionProxy.setupSupported({ cwd });
    }
  };

  const bundleDirFor = ({ projectFolder }: { projectFolder: ProjectFolder }): string =>
    bundleProxy.bundleDirFor({
      packageRoot: projectFolder.path,
      hash: BUNDLE_HASH,
    });

  const stageCachedBundle = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    bundleProxy.setupCachedSinglePackageBundle({
      packageRoot: projectFolder.path,
      hash: BUNDLE_HASH,
    });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupPassWithBundle: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      stageCachedBundle({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    getBundleDir: ({ projectFolder }: { projectFolder: ProjectFolder }): string =>
      bundleDirFor({ projectFolder }),

    setupPassWithOutput: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 0,
        stdout,
        stderr: '',
      });
    },

    setupPassWithJsonReport: ({
      projectFolder,
      jsonContent,
    }: {
      projectFolder: ProjectFolder;
      jsonContent: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      readProxy.returns({
        path: `${projectFolder.path}/.ward-playwright-report-40000.json`,
        contents: jsonContent,
      });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 1,
        stdout,
        stderr: '',
      });
    },

    setupFailWithEmptyOutput: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        exitCode: 1,
        stdout: '',
        stderr: '',
      });
    },

    setupNotE2eEligible: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      eligibleProxy.setupPackage({
        packageRoot: String(projectFolder.path),
        srcDirNames: ['brokers'],
      });
      existsProxy.returns({
        path: `${projectFolder.path}/playwright.config.ts`,
        exists: false,
      });
    },

    setupEligibleMissingConfig: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      markEligible({ projectFolder });
      existsProxy.returns({
        path: `${projectFolder.path}/playwright.config.ts`,
        exists: false,
      });
    },

    setupSourceConditionUnsupported: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): void => {
      const cwd = projectFolder.path;
      unsupportedCwds.add(cwd);
      sourceConditionProxy.setupUnsupported({ cwd });
    },

    getRemovedCachePaths: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): readonly unknown[][] =>
      removeProxy.getRemovedPaths({
        packageRoot: projectFolder.path,
        port: STAGED_SERVER_PORT,
      }),
    getSpawnedArgs: (): unknown =>
      run.getCallsFor({ command: resolvedCommandRef.value }).at(-1),
    getSpawnedEnvValue: ({ key }: { key: string }): unknown =>
      run.getOptionsFor({ command: resolvedCommandRef.value }).at(-1)?.env[key],
    getSpawnedOptions: (): unknown =>
      run.getOptionsFor({ command: resolvedCommandRef.value }).at(-1),
  };
};
