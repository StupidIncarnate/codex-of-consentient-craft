import { pruneInstanceReclaimBrokerProxy } from '../../prune/instance-reclaim/prune-instance-reclaim-broker.proxy';

export const assetsAgeLayerBrokerProxy = (): {
  setupEvidenceTree: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupEvidenceTree'];
  setupDir: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupDir'];
  setupFile: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupFile'];
  setupDeleteSucceeds: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupDeleteSucceeds'];
  getDeletedPaths: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['getDeletedPaths'];
  setupQuestFolder: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupQuestFolder'];
  setupQuestRecord: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupQuestRecord'];
  setupPlansDir: ReturnType<typeof pruneInstanceReclaimBrokerProxy>['setupPlansDir'];
} => {
  const pruneProxy = pruneInstanceReclaimBrokerProxy();

  return {
    setupEvidenceTree: pruneProxy.setupEvidenceTree,
    setupDir: pruneProxy.setupDir,
    setupFile: pruneProxy.setupFile,
    setupDeleteSucceeds: pruneProxy.setupDeleteSucceeds,
    getDeletedPaths: pruneProxy.getDeletedPaths,
    setupQuestFolder: pruneProxy.setupQuestFolder,
    setupQuestRecord: pruneProxy.setupQuestRecord,
    setupPlansDir: pruneProxy.setupPlansDir,
  };
};
