/**
 * PURPOSE: Creates and initializes the ESLint plugin with all custom rules and configurations
 *
 * USAGE:
 * import { StartEslintPlugin } from '@dungeonmaster/eslint-plugin';
 * const plugin = StartEslintPlugin();
 * // Use plugin.rules in ESLint config
 * // Use plugin.configs.dungeonmaster for pre-configured rulesets
 *
 * WHEN-TO-USE: When setting up ESLint to use Dungeonmaster custom rules
 */
import { ruleBanAdhocTypesBroker } from '../brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker';
import { ruleBanPrimitivesBroker } from '../brokers/rule/ban-primitives/rule-ban-primitives-broker';
import { ruleEnforceContractUsageInTestsBroker } from '../brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker';
import { ruleBanJestMockInTestsBroker } from '../brokers/rule/ban-jest-mock-in-tests/rule-ban-jest-mock-in-tests-broker';
import { ruleRequireZodOnPrimitivesBroker } from '../brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker';
import { ruleExplicitReturnTypesBroker } from '../brokers/rule/explicit-return-types/rule-explicit-return-types-broker';
import { ruleEnforceProjectStructureBroker } from '../brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker';
import { ruleEnforceImportDependenciesBroker } from '../brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker';
import { ruleEnforceJestMockedUsageBroker } from '../brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker';
import { ruleEnforceMagicArraysBroker } from '../brokers/rule/enforce-magic-arrays/rule-enforce-magic-arrays-broker';
import { ruleEnforceObjectDestructuringParamsBroker } from '../brokers/rule/enforce-object-destructuring-params/rule-enforce-object-destructuring-params-broker';
import { ruleEnforceOptionalGuardParamsBroker } from '../brokers/rule/enforce-optional-guard-params/rule-enforce-optional-guard-params-broker';
import { ruleEnforceStubPatternsBroker } from '../brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker';
import { ruleEnforceStubUsageBroker } from '../brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker';
import { ruleEnforceProxyChildCreationBroker } from '../brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker';
import { ruleEnforceProxyPatternsBroker } from '../brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker';
import { ruleEnforceTestColocationBroker } from '../brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker';
import { ruleEnforceTestCreationOfProxyBroker } from '../brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker';
import { ruleEnforceTestProxyImportsBroker } from '../brokers/rule/enforce-test-proxy-imports/rule-enforce-test-proxy-imports-broker';
import { ruleEnforceImplementationColocationBroker } from '../brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker';
import { ruleForbidNonExportedFunctionsBroker } from '../brokers/rule/forbid-non-exported-functions/rule-forbid-non-exported-functions-broker';
import { ruleForbidTypeReexportBroker } from '../brokers/rule/forbid-type-reexport/rule-forbid-type-reexport-broker';
import { ruleJestMockedMustImportBroker } from '../brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker';
import { ruleNoMutableStateInProxyFactoryBroker } from '../brokers/rule/no-mutable-state-in-proxy-factory/rule-no-mutable-state-in-proxy-factory-broker';
import { ruleRequireContractValidationBroker } from '../brokers/rule/require-contract-validation/rule-require-contract-validation-broker';
import { ruleNoMultiplePropertyAssertionsBroker } from '../brokers/rule/no-multiple-property-assertions/rule-no-multiple-property-assertions-broker';
import { ruleForbidTodoSkipBroker } from '../brokers/rule/forbid-todo-skip/rule-forbid-todo-skip-broker';
import { ruleEnforceRegexUsageBroker } from '../brokers/rule/enforce-regex-usage/rule-enforce-regex-usage-broker';
import { ruleEnforceFileMetadataBroker } from '../brokers/rule/enforce-file-metadata/rule-enforce-file-metadata-broker';
import { configDungeonmasterBroker } from '../brokers/config/dungeonmaster/config-dungeonmaster-broker';
import type { EslintConfig } from '../contracts/eslint-config/eslint-config-contract';
import type { EslintRule } from '../contracts/eslint-rule/eslint-rule-contract';

export const StartEslintPlugin = (): {
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
  };
  readonly configs: {
    readonly dungeonmaster: {
      readonly typescript: EslintConfig;
      readonly test: EslintConfig;
      readonly fileOverrides: readonly EslintConfig[];
    };
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
    },
    configs: {
      dungeonmaster: configDungeonmasterBroker(),
    },
  }) as const;
