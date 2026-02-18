import { checkRunLintBrokerProxy } from '../../check-run/lint/check-run-lint-broker.proxy';
import { checkRunTypecheckBrokerProxy } from '../../check-run/typecheck/check-run-typecheck-broker.proxy';
import { checkRunTestBrokerProxy } from '../../check-run/test/check-run-test-broker.proxy';

export const orchestrateRunAllLayerCheckBrokerProxy = (): {
  setupLintPass: () => void;
  setupTypecheckPass: () => void;
  setupTestPass: () => void;
  getTestSpawnedArgs: () => unknown;
} => {
  const lintProxy = checkRunLintBrokerProxy();
  const typecheckProxy = checkRunTypecheckBrokerProxy();
  const testProxy = checkRunTestBrokerProxy();

  return {
    setupLintPass: (): void => {
      lintProxy.setupPass();
    },
    setupTypecheckPass: (): void => {
      typecheckProxy.setupPass();
    },
    setupTestPass: (): void => {
      testProxy.setupPass();
    },
    getTestSpawnedArgs: (): unknown => testProxy.getSpawnedArgs(),
  };
};
