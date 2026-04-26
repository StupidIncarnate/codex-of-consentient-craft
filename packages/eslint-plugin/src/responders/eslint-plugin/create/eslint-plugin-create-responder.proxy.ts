// Child proxies for enforce-proxy-child-creation, enforce-implementation-colocation,
// enforce-proxy-patterns, and enforce-test-colocation transitively import adapter proxies
// that call jest.mock('fs'). The eslint-plugin-jest npm package uses fs.readdirSync at load
// time which breaks under the fs mock. Provide a minimal mock to prevent the crash.
import _eslintPluginJest from 'eslint-plugin-jest';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: 'eslint-plugin-jest',
  factory: () => ({
    default: { rules: {}, configs: {} },
  }),
});

import { ruleBanAdhocTypesBrokerProxy } from '../../../brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker.proxy';
import { ruleBanPrimitivesBrokerProxy } from '../../../brokers/rule/ban-primitives/rule-ban-primitives-broker.proxy';
import { ruleEnforceContractUsageInTestsBrokerProxy } from '../../../brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker.proxy';
import { ruleBanJestMockInTestsBrokerProxy } from '../../../brokers/rule/ban-jest-mock-in-tests/rule-ban-jest-mock-in-tests-broker.proxy';
import { ruleRequireZodOnPrimitivesBrokerProxy } from '../../../brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker.proxy';
import { ruleEnforceProjectStructureBrokerProxy } from '../../../brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.proxy';
import { ruleEnforceImportDependenciesBrokerProxy } from '../../../brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker.proxy';
import { ruleEnforceJestMockedUsageBrokerProxy } from '../../../brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker.proxy';
import { ruleEnforceMagicArraysBrokerProxy } from '../../../brokers/rule/enforce-magic-arrays/rule-enforce-magic-arrays-broker.proxy';
import { ruleEnforceObjectDestructuringParamsBrokerProxy } from '../../../brokers/rule/enforce-object-destructuring-params/rule-enforce-object-destructuring-params-broker.proxy';
import { ruleEnforceOptionalGuardParamsBrokerProxy } from '../../../brokers/rule/enforce-optional-guard-params/rule-enforce-optional-guard-params-broker.proxy';
import { ruleEnforceStubPatternsBrokerProxy } from '../../../brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker.proxy';
import { ruleEnforceStubUsageBrokerProxy } from '../../../brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.proxy';
import { ruleEnforceProxyChildCreationBrokerProxy } from '../../../brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy';
import { ruleEnforceProxyPatternsBrokerProxy } from '../../../brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.proxy';
import { ruleEnforceTestColocationBrokerProxy } from '../../../brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker.proxy';
import { ruleEnforceTestCreationOfProxyBrokerProxy } from '../../../brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker.proxy';
import { ruleEnforceTestProxyImportsBrokerProxy } from '../../../brokers/rule/enforce-test-proxy-imports/rule-enforce-test-proxy-imports-broker.proxy';
import { ruleEnforceImplementationColocationBrokerProxy } from '../../../brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker.proxy';
import { ruleForbidNonExportedFunctionsBrokerProxy } from '../../../brokers/rule/forbid-non-exported-functions/rule-forbid-non-exported-functions-broker.proxy';
import { ruleForbidTypeReexportBrokerProxy } from '../../../brokers/rule/forbid-type-reexport/rule-forbid-type-reexport-broker.proxy';
import { ruleJestMockedMustImportBrokerProxy } from '../../../brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker.proxy';
import { ruleNoMutableStateInProxyFactoryBrokerProxy } from '../../../brokers/rule/no-mutable-state-in-proxy-factory/rule-no-mutable-state-in-proxy-factory-broker.proxy';
import { ruleRequireContractValidationBrokerProxy } from '../../../brokers/rule/require-contract-validation/rule-require-contract-validation-broker.proxy';
import { ruleNoMultiplePropertyAssertionsBrokerProxy } from '../../../brokers/rule/no-multiple-property-assertions/rule-no-multiple-property-assertions-broker.proxy';
import { ruleForbidTodoSkipBrokerProxy } from '../../../brokers/rule/forbid-todo-skip/rule-forbid-todo-skip-broker.proxy';
import { ruleEnforceRegexUsageBrokerProxy } from '../../../brokers/rule/enforce-regex-usage/rule-enforce-regex-usage-broker.proxy';
import { ruleEnforceFileMetadataBrokerProxy } from '../../../brokers/rule/enforce-file-metadata/rule-enforce-file-metadata-broker.proxy';
import { ruleEnforceFolderReturnTypesBrokerProxy } from '../../../brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker.proxy';
import { ruleBanFetchInProxiesBrokerProxy } from '../../../brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker.proxy';
import { ruleBanStartupBranchingBrokerProxy } from '../../../brokers/rule/ban-startup-branching/rule-ban-startup-branching-broker.proxy';
import { ruleBanJestMockInProxiesBrokerProxy } from '../../../brokers/rule/ban-jest-mock-in-proxies/rule-ban-jest-mock-in-proxies-broker.proxy';
import { ruleEnforceHarnessPatternsBrokerProxy } from '../../../brokers/rule/enforce-harness-patterns/rule-enforce-harness-patterns-broker.proxy';
import { ruleBanNodeBuiltinsInTestScenariosBrokerProxy } from '../../../brokers/rule/ban-node-builtins-in-test-scenarios/rule-ban-node-builtins-in-test-scenarios-broker.proxy';
import { ruleBanInlineHelpersInTestScenariosBrokerProxy } from '../../../brokers/rule/ban-inline-helpers-in-test-scenarios/rule-ban-inline-helpers-in-test-scenarios-broker.proxy';
import { ruleBanWaitForTimeoutBrokerProxy } from '../../../brokers/rule/ban-wait-for-timeout/rule-ban-wait-for-timeout-broker.proxy';
import { ruleBanPageRouteInE2eBrokerProxy } from '../../../brokers/rule/ban-page-route-in-e2e/rule-ban-page-route-in-e2e-broker.proxy';
import { ruleEnforceE2eBaseImportBrokerProxy } from '../../../brokers/rule/enforce-e2e-base-import/rule-enforce-e2e-base-import-broker.proxy';
import { ruleBanSilentCatchBrokerProxy } from '../../../brokers/rule/ban-silent-catch/rule-ban-silent-catch-broker.proxy';
import { ruleBanNotToThrowBrokerProxy } from '../../../brokers/rule/ban-not-to-throw/rule-ban-not-to-throw-broker.proxy';
import { ruleBanWeakExistenceMatchersBrokerProxy } from '../../../brokers/rule/ban-weak-existence-matchers/rule-ban-weak-existence-matchers-broker.proxy';
import { ruleBanTypeofAssertionsBrokerProxy } from '../../../brokers/rule/ban-typeof-assertions/rule-ban-typeof-assertions-broker.proxy';
import { ruleEnforceTestNamePrefixBrokerProxy } from '../../../brokers/rule/enforce-test-name-prefix/rule-enforce-test-name-prefix-broker.proxy';
import { ruleBanUnanchoredToMatchBrokerProxy } from '../../../brokers/rule/ban-unanchored-to-match/rule-ban-unanchored-to-match-broker.proxy';
import { ruleEnforceTestidQueriesBrokerProxy } from '../../../brokers/rule/enforce-testid-queries/rule-enforce-testid-queries-broker.proxy';
import { ruleBanPlaywrightEvaluateForStylesBrokerProxy } from '../../../brokers/rule/ban-playwright-evaluate-for-styles/rule-ban-playwright-evaluate-for-styles-broker.proxy';
import { ruleBanPlaywrightExtractThenAssertBrokerProxy } from '../../../brokers/rule/ban-playwright-extract-then-assert/rule-ban-playwright-extract-then-assert-broker.proxy';
import { ruleBanNegatedMatchersBrokerProxy } from '../../../brokers/rule/ban-negated-matchers/rule-ban-negated-matchers-broker.proxy';
import { ruleBanTautologicalAssertionsBrokerProxy } from '../../../brokers/rule/ban-tautological-assertions/rule-ban-tautological-assertions-broker.proxy';
import { ruleBanObjectKeysInExpectBrokerProxy } from '../../../brokers/rule/ban-object-keys-in-expect/rule-ban-object-keys-in-expect-broker.proxy';
import { ruleBanStringIncludesInExpectBrokerProxy } from '../../../brokers/rule/ban-string-includes-in-expect/rule-ban-string-includes-in-expect-broker.proxy';
import { ruleBanWeakAsymmetricMatchersBrokerProxy } from '../../../brokers/rule/ban-weak-asymmetric-matchers/rule-ban-weak-asymmetric-matchers-broker.proxy';
import { ruleBanReflectOutsideGuardsBrokerProxy } from '../../../brokers/rule/ban-reflect-outside-guards/rule-ban-reflect-outside-guards-broker.proxy';
import { ruleBanRequireInSourceBrokerProxy } from '../../../brokers/rule/ban-require-in-source/rule-ban-require-in-source-broker.proxy';
import { ruleBanUnknownPayloadInDiscriminatedUnionBrokerProxy } from '../../../brokers/rule/ban-unknown-payload-in-discriminated-union/rule-ban-unknown-payload-in-discriminated-union-broker.proxy';
import { ruleRequireValidationOnUntypedPropertyAccessBrokerProxy } from '../../../brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.proxy';
import { configDungeonmasterBrokerProxy } from '../../../brokers/config/dungeonmaster/config-dungeonmaster-broker.proxy';
import { EslintPluginCreateResponder } from './eslint-plugin-create-responder';

export const EslintPluginCreateResponderProxy = (): {
  callResponder: typeof EslintPluginCreateResponder;
} => {
  ruleBanAdhocTypesBrokerProxy();
  ruleBanPrimitivesBrokerProxy();
  ruleEnforceContractUsageInTestsBrokerProxy();
  ruleBanJestMockInTestsBrokerProxy();
  ruleRequireZodOnPrimitivesBrokerProxy();
  ruleEnforceProjectStructureBrokerProxy();
  ruleEnforceImportDependenciesBrokerProxy();
  ruleEnforceJestMockedUsageBrokerProxy();
  ruleEnforceMagicArraysBrokerProxy();
  ruleEnforceObjectDestructuringParamsBrokerProxy();
  ruleEnforceOptionalGuardParamsBrokerProxy();
  ruleEnforceStubPatternsBrokerProxy();
  ruleEnforceStubUsageBrokerProxy();
  ruleEnforceProxyChildCreationBrokerProxy();
  ruleEnforceProxyPatternsBrokerProxy();
  ruleEnforceTestColocationBrokerProxy();
  ruleEnforceTestCreationOfProxyBrokerProxy();
  ruleEnforceTestProxyImportsBrokerProxy();
  ruleEnforceImplementationColocationBrokerProxy();
  ruleForbidNonExportedFunctionsBrokerProxy();
  ruleForbidTypeReexportBrokerProxy();
  ruleJestMockedMustImportBrokerProxy();
  ruleNoMutableStateInProxyFactoryBrokerProxy();
  ruleRequireContractValidationBrokerProxy();
  ruleNoMultiplePropertyAssertionsBrokerProxy();
  ruleForbidTodoSkipBrokerProxy();
  ruleEnforceRegexUsageBrokerProxy();
  ruleEnforceFileMetadataBrokerProxy();
  ruleEnforceFolderReturnTypesBrokerProxy();
  ruleBanFetchInProxiesBrokerProxy();
  ruleBanStartupBranchingBrokerProxy();
  ruleBanJestMockInProxiesBrokerProxy();
  ruleEnforceHarnessPatternsBrokerProxy();
  ruleBanNodeBuiltinsInTestScenariosBrokerProxy();
  ruleBanInlineHelpersInTestScenariosBrokerProxy();
  ruleBanWaitForTimeoutBrokerProxy();
  ruleBanPageRouteInE2eBrokerProxy();
  ruleEnforceE2eBaseImportBrokerProxy();
  ruleBanSilentCatchBrokerProxy();
  ruleBanNotToThrowBrokerProxy();
  ruleBanWeakExistenceMatchersBrokerProxy();
  ruleBanTypeofAssertionsBrokerProxy();
  ruleEnforceTestNamePrefixBrokerProxy();
  ruleBanUnanchoredToMatchBrokerProxy();
  ruleEnforceTestidQueriesBrokerProxy();
  ruleBanPlaywrightEvaluateForStylesBrokerProxy();
  ruleBanPlaywrightExtractThenAssertBrokerProxy();
  ruleBanNegatedMatchersBrokerProxy();
  ruleBanTautologicalAssertionsBrokerProxy();
  ruleBanObjectKeysInExpectBrokerProxy();
  ruleBanStringIncludesInExpectBrokerProxy();
  ruleBanWeakAsymmetricMatchersBrokerProxy();
  ruleBanReflectOutsideGuardsBrokerProxy();
  ruleBanRequireInSourceBrokerProxy();
  ruleBanUnknownPayloadInDiscriminatedUnionBrokerProxy();
  ruleRequireValidationOnUntypedPropertyAccessBrokerProxy();
  configDungeonmasterBrokerProxy();

  return {
    callResponder: EslintPluginCreateResponder,
  };
};
