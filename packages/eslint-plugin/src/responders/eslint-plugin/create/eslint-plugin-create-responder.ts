/**
 * PURPOSE: Assembles the ESLint plugin object with all custom rules and configurations
 *
 * USAGE:
 * const plugin = EslintPluginCreateResponder();
 * // Returns { rules: {...}, configs: {...} } ready for ESLint consumption
 */
import { ruleBanAdhocTypesBroker } from '../../../brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker';
import { ruleBanPrimitivesBroker } from '../../../brokers/rule/ban-primitives/rule-ban-primitives-broker';
import { ruleEnforceContractUsageInTestsBroker } from '../../../brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker';
import { ruleBanJestMockInTestsBroker } from '../../../brokers/rule/ban-jest-mock-in-tests/rule-ban-jest-mock-in-tests-broker';
import { ruleRequireZodOnPrimitivesBroker } from '../../../brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker';
import { ruleExplicitReturnTypesBroker } from '../../../brokers/rule/explicit-return-types/rule-explicit-return-types-broker';
import { ruleEnforceProjectStructureBroker } from '../../../brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker';
import { ruleEnforceImportDependenciesBroker } from '../../../brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker';
import { ruleEnforceJestMockedUsageBroker } from '../../../brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker';
import { ruleEnforceMagicArraysBroker } from '../../../brokers/rule/enforce-magic-arrays/rule-enforce-magic-arrays-broker';
import { ruleEnforceObjectDestructuringParamsBroker } from '../../../brokers/rule/enforce-object-destructuring-params/rule-enforce-object-destructuring-params-broker';
import { ruleEnforceOptionalGuardParamsBroker } from '../../../brokers/rule/enforce-optional-guard-params/rule-enforce-optional-guard-params-broker';
import { ruleEnforceStubPatternsBroker } from '../../../brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker';
import { ruleEnforceStubUsageBroker } from '../../../brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker';
import { ruleEnforceProxyChildCreationBroker } from '../../../brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker';
import { ruleEnforceProxyPatternsBroker } from '../../../brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker';
import { ruleEnforceTestColocationBroker } from '../../../brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker';
import { ruleEnforceTestCreationOfProxyBroker } from '../../../brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker';
import { ruleEnforceTestProxyImportsBroker } from '../../../brokers/rule/enforce-test-proxy-imports/rule-enforce-test-proxy-imports-broker';
import { ruleEnforceImplementationColocationBroker } from '../../../brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker';
import { ruleForbidNonExportedFunctionsBroker } from '../../../brokers/rule/forbid-non-exported-functions/rule-forbid-non-exported-functions-broker';
import { ruleForbidTypeReexportBroker } from '../../../brokers/rule/forbid-type-reexport/rule-forbid-type-reexport-broker';
import { ruleJestMockedMustImportBroker } from '../../../brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker';
import { ruleNoMutableStateInProxyFactoryBroker } from '../../../brokers/rule/no-mutable-state-in-proxy-factory/rule-no-mutable-state-in-proxy-factory-broker';
import { ruleRequireContractValidationBroker } from '../../../brokers/rule/require-contract-validation/rule-require-contract-validation-broker';
import { ruleNoMultiplePropertyAssertionsBroker } from '../../../brokers/rule/no-multiple-property-assertions/rule-no-multiple-property-assertions-broker';
import { ruleForbidTodoSkipBroker } from '../../../brokers/rule/forbid-todo-skip/rule-forbid-todo-skip-broker';
import { ruleEnforceRegexUsageBroker } from '../../../brokers/rule/enforce-regex-usage/rule-enforce-regex-usage-broker';
import { ruleEnforceFileMetadataBroker } from '../../../brokers/rule/enforce-file-metadata/rule-enforce-file-metadata-broker';
import { ruleBanFetchInProxiesBroker } from '../../../brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker';
import { ruleBanStartupBranchingBroker } from '../../../brokers/rule/ban-startup-branching/rule-ban-startup-branching-broker';
import { ruleBanJestMockInProxiesBroker } from '../../../brokers/rule/ban-jest-mock-in-proxies/rule-ban-jest-mock-in-proxies-broker';
import { ruleEnforceHarnessPatternsBroker } from '../../../brokers/rule/enforce-harness-patterns/rule-enforce-harness-patterns-broker';
import { ruleBanNodeBuiltinsInTestScenariosBroker } from '../../../brokers/rule/ban-node-builtins-in-test-scenarios/rule-ban-node-builtins-in-test-scenarios-broker';
import { ruleBanInlineHelpersInTestScenariosBroker } from '../../../brokers/rule/ban-inline-helpers-in-test-scenarios/rule-ban-inline-helpers-in-test-scenarios-broker';
import { ruleBanSilentCatchBroker } from '../../../brokers/rule/ban-silent-catch/rule-ban-silent-catch-broker';
import { ruleBanWaitForTimeoutBroker } from '../../../brokers/rule/ban-wait-for-timeout/rule-ban-wait-for-timeout-broker';
import { ruleBanPageRouteInE2eBroker } from '../../../brokers/rule/ban-page-route-in-e2e/rule-ban-page-route-in-e2e-broker';
import { ruleEnforceE2eBaseImportBroker } from '../../../brokers/rule/enforce-e2e-base-import/rule-enforce-e2e-base-import-broker';
import { ruleBanNotToThrowBroker } from '../../../brokers/rule/ban-not-to-throw/rule-ban-not-to-throw-broker';
import { ruleBanWeakExistenceMatchersBroker } from '../../../brokers/rule/ban-weak-existence-matchers/rule-ban-weak-existence-matchers-broker';
import { ruleBanTypeofAssertionsBroker } from '../../../brokers/rule/ban-typeof-assertions/rule-ban-typeof-assertions-broker';
import { ruleEnforceTestNamePrefixBroker } from '../../../brokers/rule/enforce-test-name-prefix/rule-enforce-test-name-prefix-broker';
import { ruleBanUnanchoredToMatchBroker } from '../../../brokers/rule/ban-unanchored-to-match/rule-ban-unanchored-to-match-broker';
import { ruleEnforceTestidQueriesBroker } from '../../../brokers/rule/enforce-testid-queries/rule-enforce-testid-queries-broker';
import { ruleBanPlaywrightEvaluateForStylesBroker } from '../../../brokers/rule/ban-playwright-evaluate-for-styles/rule-ban-playwright-evaluate-for-styles-broker';
import { ruleBanPlaywrightExtractThenAssertBroker } from '../../../brokers/rule/ban-playwright-extract-then-assert/rule-ban-playwright-extract-then-assert-broker';
import { ruleBanNegatedMatchersBroker } from '../../../brokers/rule/ban-negated-matchers/rule-ban-negated-matchers-broker';
import { ruleBanTautologicalAssertionsBroker } from '../../../brokers/rule/ban-tautological-assertions/rule-ban-tautological-assertions-broker';
import { ruleBanObjectKeysInExpectBroker } from '../../../brokers/rule/ban-object-keys-in-expect/rule-ban-object-keys-in-expect-broker';
import { ruleBanStringIncludesInExpectBroker } from '../../../brokers/rule/ban-string-includes-in-expect/rule-ban-string-includes-in-expect-broker';
import { configDungeonmasterBroker } from '../../../brokers/config/dungeonmaster/config-dungeonmaster-broker';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';

export const EslintPluginCreateResponder = (): {
  readonly rules: {
    readonly 'ban-adhoc-types': EslintRule;
    readonly 'ban-primitives': EslintRule;
    readonly 'enforce-contract-usage-in-tests': EslintRule;
    readonly 'ban-jest-mock-in-tests': EslintRule;
    readonly 'require-zod-on-primitives': EslintRule;
    readonly 'explicit-return-types': EslintRule;
    readonly 'enforce-project-structure': EslintRule;
    readonly 'enforce-import-dependencies': EslintRule;
    readonly 'enforce-jest-mocked-usage': EslintRule;
    readonly 'enforce-magic-arrays': EslintRule;
    readonly 'enforce-object-destructuring-params': EslintRule;
    readonly 'enforce-optional-guard-params': EslintRule;
    readonly 'enforce-stub-patterns': EslintRule;
    readonly 'enforce-stub-usage': EslintRule;
    readonly 'enforce-proxy-child-creation': EslintRule;
    readonly 'enforce-proxy-patterns': EslintRule;
    readonly 'enforce-test-colocation': EslintRule;
    readonly 'enforce-test-creation-of-proxy': EslintRule;
    readonly 'enforce-test-proxy-imports': EslintRule;
    readonly 'enforce-implementation-colocation': EslintRule;
    readonly 'forbid-non-exported-functions': EslintRule;
    readonly 'forbid-type-reexport': EslintRule;
    readonly 'jest-mocked-must-import': EslintRule;
    readonly 'no-mutable-state-in-proxy-factory': EslintRule;
    readonly 'require-contract-validation': EslintRule;
    readonly 'no-multiple-property-assertions': EslintRule;
    readonly 'forbid-todo-skip': EslintRule;
    readonly 'enforce-regex-usage': EslintRule;
    readonly 'enforce-file-metadata': EslintRule;
    readonly 'ban-fetch-in-proxies': EslintRule;
    readonly 'ban-startup-branching': EslintRule;
    readonly 'ban-jest-mock-in-proxies': EslintRule;
    readonly 'enforce-harness-patterns': EslintRule;
    readonly 'ban-node-builtins-in-test-scenarios': EslintRule;
    readonly 'ban-inline-helpers-in-test-scenarios': EslintRule;
    readonly 'ban-silent-catch': EslintRule;
    readonly 'ban-wait-for-timeout': EslintRule;
    readonly 'ban-page-route-in-e2e': EslintRule;
    readonly 'enforce-e2e-base-import': EslintRule;
    readonly 'ban-not-to-throw': EslintRule;
    readonly 'ban-weak-existence-matchers': EslintRule;
    readonly 'ban-typeof-assertions': EslintRule;
    readonly 'enforce-test-name-prefix': EslintRule;
    readonly 'ban-unanchored-to-match': EslintRule;
    readonly 'enforce-testid-queries': EslintRule;
    readonly 'ban-playwright-evaluate-for-styles': EslintRule;
    readonly 'ban-playwright-extract-then-assert': EslintRule;
    readonly 'ban-negated-matchers': EslintRule;
    readonly 'ban-tautological-assertions': EslintRule;
    readonly 'ban-object-keys-in-expect': EslintRule;
    readonly 'ban-string-includes-in-expect': EslintRule;
  };
  readonly configs: {
    readonly dungeonmaster: ReturnType<typeof configDungeonmasterBroker>;
    readonly dungeonmasterTest: ReturnType<typeof configDungeonmasterBroker>;
  };
} =>
  ({
    rules: {
      'ban-adhoc-types': ruleBanAdhocTypesBroker(),
      'ban-primitives': ruleBanPrimitivesBroker(),
      'enforce-contract-usage-in-tests': ruleEnforceContractUsageInTestsBroker(),
      'ban-jest-mock-in-tests': ruleBanJestMockInTestsBroker(),
      'require-zod-on-primitives': ruleRequireZodOnPrimitivesBroker(),
      'explicit-return-types': ruleExplicitReturnTypesBroker(),
      'enforce-project-structure': ruleEnforceProjectStructureBroker(),
      'enforce-import-dependencies': ruleEnforceImportDependenciesBroker(),
      'enforce-jest-mocked-usage': ruleEnforceJestMockedUsageBroker(),
      'enforce-magic-arrays': ruleEnforceMagicArraysBroker(),
      'enforce-object-destructuring-params': ruleEnforceObjectDestructuringParamsBroker(),
      'enforce-optional-guard-params': ruleEnforceOptionalGuardParamsBroker(),
      'enforce-stub-patterns': ruleEnforceStubPatternsBroker(),
      'enforce-stub-usage': ruleEnforceStubUsageBroker(),
      'enforce-proxy-child-creation': ruleEnforceProxyChildCreationBroker(),
      'enforce-proxy-patterns': ruleEnforceProxyPatternsBroker(),
      'enforce-test-colocation': ruleEnforceTestColocationBroker(),
      'enforce-test-creation-of-proxy': ruleEnforceTestCreationOfProxyBroker(),
      'enforce-test-proxy-imports': ruleEnforceTestProxyImportsBroker(),
      'enforce-implementation-colocation': ruleEnforceImplementationColocationBroker(),
      'forbid-non-exported-functions': ruleForbidNonExportedFunctionsBroker(),
      'forbid-type-reexport': ruleForbidTypeReexportBroker(),
      'jest-mocked-must-import': ruleJestMockedMustImportBroker(),
      'no-mutable-state-in-proxy-factory': ruleNoMutableStateInProxyFactoryBroker(),
      'require-contract-validation': ruleRequireContractValidationBroker(),
      'no-multiple-property-assertions': ruleNoMultiplePropertyAssertionsBroker(),
      'forbid-todo-skip': ruleForbidTodoSkipBroker(),
      'enforce-regex-usage': ruleEnforceRegexUsageBroker(),
      'enforce-file-metadata': ruleEnforceFileMetadataBroker(),
      'ban-fetch-in-proxies': ruleBanFetchInProxiesBroker(),
      'ban-startup-branching': ruleBanStartupBranchingBroker(),
      'ban-jest-mock-in-proxies': ruleBanJestMockInProxiesBroker(),
      'enforce-harness-patterns': ruleEnforceHarnessPatternsBroker(),
      'ban-node-builtins-in-test-scenarios': ruleBanNodeBuiltinsInTestScenariosBroker(),
      'ban-inline-helpers-in-test-scenarios': ruleBanInlineHelpersInTestScenariosBroker(),
      'ban-silent-catch': ruleBanSilentCatchBroker(),
      'ban-wait-for-timeout': ruleBanWaitForTimeoutBroker(),
      'ban-page-route-in-e2e': ruleBanPageRouteInE2eBroker(),
      'enforce-e2e-base-import': ruleEnforceE2eBaseImportBroker(),
      'ban-not-to-throw': ruleBanNotToThrowBroker(),
      'ban-weak-existence-matchers': ruleBanWeakExistenceMatchersBroker(),
      'ban-typeof-assertions': ruleBanTypeofAssertionsBroker(),
      'enforce-test-name-prefix': ruleEnforceTestNamePrefixBroker(),
      'ban-unanchored-to-match': ruleBanUnanchoredToMatchBroker(),
      'enforce-testid-queries': ruleEnforceTestidQueriesBroker(),
      'ban-playwright-evaluate-for-styles': ruleBanPlaywrightEvaluateForStylesBroker(),
      'ban-playwright-extract-then-assert': ruleBanPlaywrightExtractThenAssertBroker(),
      'ban-negated-matchers': ruleBanNegatedMatchersBroker(),
      'ban-tautological-assertions': ruleBanTautologicalAssertionsBroker(),
      'ban-object-keys-in-expect': ruleBanObjectKeysInExpectBroker(),
      'ban-string-includes-in-expect': ruleBanStringIncludesInExpectBroker(),
    },
    configs: {
      dungeonmaster: configDungeonmasterBroker(),
      dungeonmasterTest: configDungeonmasterBroker({ forTesting: true }),
    },
  }) as const;
