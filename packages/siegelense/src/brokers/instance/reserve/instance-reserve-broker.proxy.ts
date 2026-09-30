import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { currentBranchProxy } from '#gateway/bin/git/current-branch/current-branch.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { pidProxy } from '#gateway/node/process/pid/pid.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { freePortPairProxy } from '#gateway/node/net/free-port-pair/free-port-pair.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

const UUID_VALUE = '7f3a9c21-58cc-4372-a567-0e02b2c3d479';
const NOW_MS_VALUE = 1_700_000_000_000;

export const instanceReserveBrokerProxy = (): {
  mintedInstanceId: () => ReturnType<typeof InstanceIdStub>;
  mintedReservedAtMs: () => number;
  setupRegistry: (params: { json: string }) => void;
  setupRegistryForExhaustedClaim: (params: { json: string }) => void;
  setupEvidenceDir: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
  }) => void;
  // Stages the OS's answer for every port-claim candidate this broker asks for, in call order —
  // this broker asks for `claimAttempts` pairs UPFRONT (they don't depend on each other), so
  // every scenario stages exactly that many pairs; a scenario needing fewer real candidates
  // repeats its last (uncontested) pair for the remainder.
  setupPortCandidates: (params: {
    pairs: readonly { api: number; web: number }[];
  }) => void;
  setupCwd: (params: { value: string }) => void;
  setupBranch: (params: { branch: string | null }) => void;
  setupBranchFailure: (params: { exitCode: number; output: string }) => void;
  getWrittenRegistry: () => unknown;
  getRegistryWritePathsInOrder: (params: { alongside: string }) => readonly unknown[];
  stageNextRegistryWriteSucceeds: () => void;
  getCreatedDirs: () => readonly unknown[];
} => {
  const updateProxy = registryUpdateBrokerProxy();
  const evidenceProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const mkdirProxy = ensureDirProxy();
  const branchProxy = currentBranchProxy();
  const cwdRecorder = cwdProxy();
  pidProxy();
  const clockProxy = nowProxy();
  const portPairProxy = freePortPairProxy();

  registerMock({ fn: randomUUID }).calledWith([]).returns(UUID_VALUE);

  // The two paths setupEvidenceDir stages ensureDir for, captured so getCreatedDirs can read both
  // back afterward — a const holder whose fields mutate, not a reassigned let.
  const capturedDirsState: { rootPath: string | null; evidencePath: string | null } = {
    rootPath: null,
    evidencePath: null,
  };

  return {
    mintedInstanceId: (): ReturnType<typeof InstanceIdStub> =>
      InstanceIdStub({ value: `inst_${UUID_VALUE.split('-').join('')}` }),

    mintedReservedAtMs: (): number => NOW_MS_VALUE,

    setupRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    // registryUpdateBroker's mutate throws PortClaimExhaustedError when every candidate pair
    // collides, before registryWriteBroker is ever reached — so this stages no write path
    // resolution at all, matching the broker's real call order (acquire, read, release).
    setupRegistryForExhaustedClaim: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistryForThrowingMutate({ json });
    },

    setupEvidenceDir: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
    }): void => {
      evidenceProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
      mkdirProxy.succeeds({ path: String(evidencePath) });
      capturedDirsState.rootPath = rootPath;
      capturedDirsState.evidencePath = evidencePath;
    },

    // Staged in the SAME order this broker asks the OS for candidates (upfront, before it ever
    // reads the registry), so pairs[0] answers the first call, pairs[1] the second, and so on.
    setupPortCandidates: ({
      pairs,
    }: {
      pairs: readonly { api: number; web: number }[];
    }): void => {
      portPairProxy.returnsSequence({
        pairs: pairs.map(({ api, web }) => ({ server: api, web })),
      });
    },

    // currentBranchProxy has no single "branch or null" method — a detached HEAD and a named
    // branch are staged through its two separate scenario methods.
    setupCwd: ({ value }: { value: string }): void => {
      cwdRecorder.setupCwd({ value });
    },

    setupBranch: ({ branch }: { branch: string | null }): void => {
      clockProxy.setupNow({ ms: NOW_MS_VALUE });
      if (branch === null) {
        branchProxy.setupDetached();
        return;
      }
      branchProxy.setupBranch({ branch });
    },

    setupBranchFailure: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      clockProxy.setupNow({ ms: NOW_MS_VALUE });
      branchProxy.setupFailure({ exitCode, output });
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },

    getRegistryWritePathsInOrder: ({ alongside }: { alongside: string }): readonly unknown[] =>
      updateProxy.getWritePathsInOrder({ alongside }),

    stageNextRegistryWriteSucceeds: (): void => {
      updateProxy.stageNextWriteSucceeds();
    },

    // registryUpdateBroker's own acquire (still the old shared fsMkdirAdapter) and its own write
    // (already migrated to ensureDir) both create rootPath, and both land on the exact same
    // underlying 'fs/promises' mkdir this file's ensureDir mock replaces — so addressing by
    // rootPath's exact string reads back both, in call order, ahead of this broker's own
    // evidence-dir ensureDir call, reconstructing [rootPath, rootPath, evidencePath].
    getCreatedDirs: (): readonly unknown[] => {
      const { rootPath, evidencePath } = capturedDirsState;
      if (rootPath === null || evidencePath === null) {
        return [];
      }
      return [
        ...mkdirProxy.getCallsFor({ path: String(rootPath) }).map(() => rootPath),
        ...mkdirProxy.getCallsFor({ path: String(evidencePath) }).map(() => evidencePath),
      ];
    },
  };
};
