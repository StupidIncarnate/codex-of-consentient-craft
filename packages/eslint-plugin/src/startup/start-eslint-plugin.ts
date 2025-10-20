import { banAdhocTypesRuleBroker } from '../brokers/rule/ban-adhoc-types/ban-adhoc-types-rule-broker';
import { banPrimitivesRuleBroker } from '../brokers/rule/ban-primitives/ban-primitives-rule-broker';
import { banContractInTestsRuleBroker } from '../brokers/rule/ban-contract-in-tests/ban-contract-in-tests-rule-broker';
import { banJestMockInTestsRuleBroker } from '../brokers/rule/ban-jest-mock-in-tests/ban-jest-mock-in-tests-rule-broker';
import { requireZodOnPrimitivesRuleBroker } from '../brokers/rule/require-zod-on-primitives/require-zod-on-primitives-rule-broker';
import { explicitReturnTypesRuleBroker } from '../brokers/rule/explicit-return-types/explicit-return-types-rule-broker';
import { enforceProjectStructureRuleBroker } from '../brokers/rule/enforce-project-structure/enforce-project-structure-rule-broker';
import { enforceImportDependenciesRuleBroker } from '../brokers/rule/enforce-import-dependencies/enforce-import-dependencies-rule-broker';
import { enforceJestMockedUsageRuleBroker } from '../brokers/rule/enforce-jest-mocked-usage/enforce-jest-mocked-usage-rule-broker';
import { enforceObjectDestructuringParamsRuleBroker } from '../brokers/rule/enforce-object-destructuring-params/enforce-object-destructuring-params-rule-broker';
import { enforceOptionalGuardParamsRuleBroker } from '../brokers/rule/enforce-optional-guard-params/enforce-optional-guard-params-rule-broker';
import { enforceStubPatternsRuleBroker } from '../brokers/rule/enforce-stub-patterns/enforce-stub-patterns-rule-broker';
import { enforceProxyChildCreationRuleBroker } from '../brokers/rule/enforce-proxy-child-creation/enforce-proxy-child-creation-rule-broker';
import { enforceProxyPatternsRuleBroker } from '../brokers/rule/enforce-proxy-patterns/enforce-proxy-patterns-rule-broker';
import { enforceTestColocationRuleBroker } from '../brokers/rule/enforce-test-colocation/enforce-test-colocation-rule-broker';
import { enforceTestCreationOfProxyRuleBroker } from '../brokers/rule/enforce-test-creation-of-proxy/enforce-test-creation-of-proxy-rule-broker';
import { enforceTestProxyImportsRuleBroker } from '../brokers/rule/enforce-test-proxy-imports/enforce-test-proxy-imports-rule-broker';
import { enforceImplementationColocationRuleBroker } from '../brokers/rule/enforce-implementation-colocation/enforce-implementation-colocation-rule-broker';
import { forbidNonExportedFunctionsRuleBroker } from '../brokers/rule/forbid-non-exported-functions/forbid-non-exported-functions-rule-broker';
import { jestMockedMustImportRuleBroker } from '../brokers/rule/jest-mocked-must-import/jest-mocked-must-import-rule-broker';
import { noMutableStateInProxyFactoryRuleBroker } from '../brokers/rule/no-mutable-state-in-proxy-factory/no-mutable-state-in-proxy-factory-rule-broker';
import { requireContractValidationRuleBroker } from '../brokers/rule/require-contract-validation/require-contract-validation-rule-broker';
import { noMultiplePropertyAssertionsRuleBroker } from '../brokers/rule/no-multiple-property-assertions/no-multiple-property-assertions-rule-broker';
import { questmaestroConfigBroker } from '../brokers/config/questmaestro/questmaestro-config-broker';
import type { EslintConfig } from '../contracts/eslint-config/eslint-config-contract';
import type { EslintRule } from '../contracts/eslint-rule/eslint-rule-contract';

export const startEslintPlugin = (): {
  readonly rules: {
    readonly 'ban-adhoc-types': EslintRule;
    readonly 'ban-primitives': EslintRule;
    readonly 'ban-contract-in-tests': EslintRule;
    readonly 'ban-jest-mock-in-tests': EslintRule;
    readonly 'require-zod-on-primitives': EslintRule;
    readonly 'explicit-return-types': EslintRule;
    readonly 'enforce-project-structure': EslintRule;
    readonly 'enforce-import-dependencies': EslintRule;
    readonly 'enforce-jest-mocked-usage': EslintRule;
    readonly 'enforce-object-destructuring-params': EslintRule;
    readonly 'enforce-optional-guard-params': EslintRule;
    readonly 'enforce-stub-patterns': EslintRule;
    readonly 'enforce-proxy-child-creation': EslintRule;
    readonly 'enforce-proxy-patterns': EslintRule;
    readonly 'enforce-test-colocation': EslintRule;
    readonly 'enforce-test-creation-of-proxy': EslintRule;
    readonly 'enforce-test-proxy-imports': EslintRule;
    readonly 'enforce-implementation-colocation': EslintRule;
    readonly 'forbid-non-exported-functions': EslintRule;
    readonly 'jest-mocked-must-import': EslintRule;
    readonly 'no-mutable-state-in-proxy-factory': EslintRule;
    readonly 'require-contract-validation': EslintRule;
    readonly 'no-multiple-property-assertions': EslintRule;
  };
  readonly configs: {
    readonly questmaestro: {
      readonly typescript: EslintConfig;
      readonly test: EslintConfig;
      readonly fileOverrides: readonly EslintConfig[];
    };
  };
} =>
  ({
    rules: {
      'ban-adhoc-types': banAdhocTypesRuleBroker(),
      'ban-primitives': banPrimitivesRuleBroker(),
      'ban-contract-in-tests': banContractInTestsRuleBroker(),
      'ban-jest-mock-in-tests': banJestMockInTestsRuleBroker(),
      'require-zod-on-primitives': requireZodOnPrimitivesRuleBroker(),
      'explicit-return-types': explicitReturnTypesRuleBroker(),
      'enforce-project-structure': enforceProjectStructureRuleBroker(),
      'enforce-import-dependencies': enforceImportDependenciesRuleBroker(),
      'enforce-jest-mocked-usage': enforceJestMockedUsageRuleBroker(),
      'enforce-object-destructuring-params': enforceObjectDestructuringParamsRuleBroker(),
      'enforce-optional-guard-params': enforceOptionalGuardParamsRuleBroker(),
      'enforce-stub-patterns': enforceStubPatternsRuleBroker(),
      'enforce-proxy-child-creation': enforceProxyChildCreationRuleBroker(),
      'enforce-proxy-patterns': enforceProxyPatternsRuleBroker(),
      'enforce-test-colocation': enforceTestColocationRuleBroker(),
      'enforce-test-creation-of-proxy': enforceTestCreationOfProxyRuleBroker(),
      'enforce-test-proxy-imports': enforceTestProxyImportsRuleBroker(),
      'enforce-implementation-colocation': enforceImplementationColocationRuleBroker(),
      'forbid-non-exported-functions': forbidNonExportedFunctionsRuleBroker(),
      'jest-mocked-must-import': jestMockedMustImportRuleBroker(),
      'no-mutable-state-in-proxy-factory': noMutableStateInProxyFactoryRuleBroker(),
      'require-contract-validation': requireContractValidationRuleBroker(),
      'no-multiple-property-assertions': noMultiplePropertyAssertionsRuleBroker(),
    },
    configs: {
      questmaestro: questmaestroConfigBroker(),
    },
  }) as const;
