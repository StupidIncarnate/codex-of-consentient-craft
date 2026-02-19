import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { checkRunLintBrokerProxy } from '../../check-run/lint/check-run-lint-broker.proxy';
import { checkRunTypecheckBrokerProxy } from '../../check-run/typecheck/check-run-typecheck-broker.proxy';
import { checkRunTestBrokerProxy } from '../../check-run/test/check-run-test-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';

export const commandRunLayerSingleBrokerProxy = (): {
  setupAllChecksPass: () => void;
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);

  const lintProxy = checkRunLintBrokerProxy();
  const typecheckProxy = checkRunTypecheckBrokerProxy();
  const testProxy = checkRunTestBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();

  return {
    setupAllChecksPass: (): void => {
      lintProxy.setupPass();
      typecheckProxy.setupPass();
      testProxy.setupPass();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
  };
};
