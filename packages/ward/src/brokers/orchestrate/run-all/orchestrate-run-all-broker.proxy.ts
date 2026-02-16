import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { projectFolderDiscoverBrokerProxy } from '../../project-folder/discover/project-folder-discover-broker.proxy';
import { globResolveBrokerProxy } from '../../glob/resolve/glob-resolve-broker.proxy';
import { changedFilesDiscoverBrokerProxy } from '../../changed-files/discover/changed-files-discover-broker.proxy';
import { checkRunE2eBrokerProxy } from '../../check-run/e2e/check-run-e2e-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { orchestrateRunAllLayerCheckBrokerProxy } from './orchestrate-run-all-layer-check-broker.proxy';

export const orchestrateRunAllBrokerProxy = (): {
  setupDefaultRun: (params: {
    gitOutput: string;
    packageContents: string[];
    checkCount: number;
  }) => void;
  setupWithGlob: (params: {
    gitOutput: string;
    packageContents: string[];
    globOutput: string;
    checkCount: number;
  }) => void;
  setupWithChanged: (params: {
    gitOutput: string;
    packageContents: string[];
    diffOutput: string;
    checkCount: number;
  }) => void;
  setupNoProjects: () => void;
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);
  const discoverProxy = projectFolderDiscoverBrokerProxy();
  const globProxy = globResolveBrokerProxy();
  const changedProxy = changedFilesDiscoverBrokerProxy();
  const e2eProxy = checkRunE2eBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const layerCheckProxy = orchestrateRunAllLayerCheckBrokerProxy();

  const setupChecksForCount = ({ checkCount }: { checkCount: number }): void => {
    Array.from({ length: checkCount }).forEach(() => {
      layerCheckProxy.setupLintPass();
    });
    Array.from({ length: checkCount }).forEach(() => {
      layerCheckProxy.setupTypecheckPass();
    });
    Array.from({ length: checkCount }).forEach(() => {
      layerCheckProxy.setupTestPass();
    });
  };

  return {
    setupDefaultRun: ({
      gitOutput,
      packageContents,
      checkCount,
    }: {
      gitOutput: string;
      packageContents: string[];
      checkCount: number;
    }): void => {
      discoverProxy.setupFindsPackages({ gitOutput, packageContents });
      setupChecksForCount({ checkCount });
      e2eProxy.setupPass();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },

    setupWithGlob: ({
      gitOutput,
      packageContents,
      globOutput,
      checkCount,
    }: {
      gitOutput: string;
      packageContents: string[];
      globOutput: string;
      checkCount: number;
    }): void => {
      discoverProxy.setupFindsPackages({ gitOutput, packageContents });
      globProxy.setupMatches({ output: globOutput });
      setupChecksForCount({ checkCount });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },

    setupWithChanged: ({
      gitOutput,
      packageContents,
      diffOutput,
      checkCount,
    }: {
      gitOutput: string;
      packageContents: string[];
      diffOutput: string;
      checkCount: number;
    }): void => {
      discoverProxy.setupFindsPackages({ gitOutput, packageContents });
      changedProxy.setupWithChangedFiles({ diffOutput });
      setupChecksForCount({ checkCount });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },

    setupNoProjects: (): void => {
      discoverProxy.setupNoPackages();
      e2eProxy.setupPass();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
  };
};
