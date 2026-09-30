import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { citationResolveBrokerProxy } from '../../citation/resolve/citation-resolve-broker.proxy';
import { pruneAssetsListBrokerProxy } from '../assets-list/prune-assets-list-broker.proxy';

export const pruneInstanceReclaimBrokerProxy = (): {
  setupEvidenceTree: ReturnType<typeof pruneAssetsListBrokerProxy>['setupEvidenceTree'];
  setupDir: ReturnType<typeof pruneAssetsListBrokerProxy>['setupDir'];
  setupFile: ReturnType<typeof pruneAssetsListBrokerProxy>['setupFile'];
  setupDeleteSucceeds: (params: { filePath: string }) => void;
  getDeletedPaths: () => unknown[];
  setupQuestFolder: ReturnType<typeof citationResolveBrokerProxy>['setupQuestFolder'];
  setupQuestRecord: ReturnType<typeof citationResolveBrokerProxy>['setupQuestRecord'];
  setupPlansDir: ReturnType<typeof citationResolveBrokerProxy>['setupPlansDir'];
  setupPlanFile: ReturnType<typeof citationResolveBrokerProxy>['setupPlanFile'];
} => {
  const assetsProxy = pruneAssetsListBrokerProxy();
  const citationProxy = citationResolveBrokerProxy();
  const deleteProxy = unlinkProxy();
  // Read-back addresses only the paths this test staged; an unstaged unlink already throws.
  const stagedDeletePaths: string[] = [];

  return {
    setupEvidenceTree: assetsProxy.setupEvidenceTree,
    setupDir: assetsProxy.setupDir,
    setupFile: assetsProxy.setupFile,
    setupDeleteSucceeds: ({ filePath }: { filePath: string }): void => {
      stagedDeletePaths.push(filePath);
      deleteProxy.succeeds({ path: filePath });
    },
    getDeletedPaths: (): unknown[] =>
      deleteProxy
        .getCallsFor({
          path: (value: unknown): boolean => stagedDeletePaths.some((path) => path === value),
        })
        .map((call) => call[0]),
    setupQuestFolder: citationProxy.setupQuestFolder,
    setupQuestRecord: citationProxy.setupQuestRecord,
    setupPlansDir: citationProxy.setupPlansDir,
    setupPlanFile: citationProxy.setupPlanFile,
  };
};
