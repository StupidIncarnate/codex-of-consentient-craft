import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { checkRunLintBrokerProxy } from '../../check-run/lint/check-run-lint-broker.proxy';
import { checkRunTypecheckBrokerProxy } from '../../check-run/typecheck/check-run-typecheck-broker.proxy';
import { checkRunUnitBrokerProxy } from '../../check-run/unit/check-run-unit-broker.proxy';
import { checkRunE2eBrokerProxy } from '../../check-run/e2e/check-run-e2e-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';

export const commandRunLayerSingleBrokerProxy = (): {
  setupAllChecksPass: () => void;
  setupLintOnlyPass: () => void;
  setupLintOnlyFail: (params: { stdout: string }) => void;
  setupE2eOnlySkip: () => void;
  getStderrCalls: () => unknown[];
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);
  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const lintProxy = checkRunLintBrokerProxy();
  const typecheckProxy = checkRunTypecheckBrokerProxy();
  const unitProxy = checkRunUnitBrokerProxy();
  const e2eProxy = checkRunE2eBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();

  return {
    setupAllChecksPass: (): void => {
      lintProxy.setupPass();
      typecheckProxy.setupPass();
      unitProxy.setupPass();
      e2eProxy.setupPass();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupLintOnlyPass: (): void => {
      lintProxy.setupPass();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupLintOnlyFail: ({ stdout }: { stdout: string }): void => {
      lintProxy.setupFail({ stdout });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupE2eOnlySkip: (): void => {
      e2eProxy.setupNoPlaywrightConfig();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
  };
};
