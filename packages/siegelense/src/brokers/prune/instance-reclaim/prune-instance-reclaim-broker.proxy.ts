import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { citationResolveBrokerProxy } from '../../citation/resolve/citation-resolve-broker.proxy';
import { pruneAssetsListBrokerProxy } from '../assets-list/prune-assets-list-broker.proxy';

export const pruneInstanceReclaimBrokerProxy = (): {
  setupEvidenceTree: ReturnType<typeof pruneAssetsListBrokerProxy>['setupEvidenceTree'];
  setupDir: ReturnType<typeof pruneAssetsListBrokerProxy>['setupDir'];
  setupFile: ReturnType<typeof pruneAssetsListBrokerProxy>['setupFile'];
  setupDeleteSucceeds: ReturnType<typeof fsUnlinkAdapterProxy>['succeeds'];
  getDeletedPaths: ReturnType<typeof fsUnlinkAdapterProxy>['getDeletedPaths'];
  setupQuestFolder: ReturnType<typeof citationResolveBrokerProxy>['setupQuestFolder'];
  setupQuestRecord: ReturnType<typeof citationResolveBrokerProxy>['setupQuestRecord'];
  setupPlansDir: ReturnType<typeof citationResolveBrokerProxy>['setupPlansDir'];
  setupPlanFile: ReturnType<typeof citationResolveBrokerProxy>['setupPlanFile'];
} => {
  const assetsProxy = pruneAssetsListBrokerProxy();
  const citationProxy = citationResolveBrokerProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();

  return {
    setupEvidenceTree: assetsProxy.setupEvidenceTree,
    setupDir: assetsProxy.setupDir,
    setupFile: assetsProxy.setupFile,
    setupDeleteSucceeds: unlinkProxy.succeeds,
    getDeletedPaths: unlinkProxy.getDeletedPaths,
    setupQuestFolder: citationProxy.setupQuestFolder,
    setupQuestRecord: citationProxy.setupQuestRecord,
    setupPlansDir: citationProxy.setupPlansDir,
    setupPlanFile: citationProxy.setupPlanFile,
  };
};
