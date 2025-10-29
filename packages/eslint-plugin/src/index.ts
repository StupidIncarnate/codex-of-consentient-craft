/**
 * PURPOSE: Main entry point for the @questmaestro/eslint-plugin package exporting rules, configs, and contracts
 *
 * USAGE:
 * import plugin from '@questmaestro/eslint-plugin';
 * // Returns ESLint plugin with all rules and configurations
 */
export { StartEslintPlugin } from './startup/start-eslint-plugin';

// Export contracts for advanced usage
export type { EslintRule } from './contracts/eslint-rule/eslint-rule-contract';
export type { EslintConfig } from './contracts/eslint-config/eslint-config-contract';
export type { TsconfigOptions } from './contracts/tsconfig-options/tsconfig-options-contract';
export type { AstNode } from './contracts/ast-node/ast-node-contract';
export type { RuleViolation } from './contracts/rule-violation/rule-violation-contract';

// Export brokers for custom configurations
export { ruleBanPrimitivesBroker } from './brokers/rule/ban-primitives/rule-ban-primitives-broker';
export { ruleBanContractInTestsBroker } from './brokers/rule/ban-contract-in-tests/rule-ban-contract-in-tests-broker';
export { ruleRequireZodOnPrimitivesBroker } from './brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker';
export { ruleExplicitReturnTypesBroker } from './brokers/rule/explicit-return-types/rule-explicit-return-types-broker';
export { ruleRequireContractValidationBroker } from './brokers/rule/require-contract-validation/rule-require-contract-validation-broker';
export { configQuestmaestroBroker } from './brokers/config/questmaestro/config-questmaestro-broker';
export { questmaestroRuleEnforceOnStatics } from './statics/questmaestro-rule-enforce-on/questmaestro-rule-enforce-on-statics';
export { configTsconfigBroker } from './brokers/config/tsconfig/config-tsconfig-broker';

// Export transformers for advanced usage
export { mergeConfigsTransformer } from './transformers/merge-configs/merge-configs-transformer';
export { astToViolationTransformer } from './transformers/ast-to-violation/ast-to-violation-transformer';

import { StartEslintPlugin } from './startup/start-eslint-plugin';

// Default export for standard ESLint plugin usage
const plugin = StartEslintPlugin();
export default plugin;
