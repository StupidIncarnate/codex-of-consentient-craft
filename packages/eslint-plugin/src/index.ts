export { startEslintPlugin } from './startup/start-eslint-plugin';

// Export contracts for advanced usage
export type { EslintRule } from './contracts/eslint-rule/eslint-rule-contract';
export type { EslintConfig } from './contracts/eslint-config/eslint-config-contract';
export type { TsconfigOptions } from './contracts/tsconfig-options/tsconfig-options-contract';
export type { AstNode } from './contracts/ast-node/ast-node-contract';
export type { RuleViolation } from './contracts/rule-violation/rule-violation-contract';

// Export brokers for custom configurations
export { banPrimitivesRuleBroker } from './brokers/rule/ban-primitives/ban-primitives-rule-broker';
export { requireZodOnPrimitivesRuleBroker } from './brokers/rule/require-zod-on-primitives/require-zod-on-primitives-rule-broker';
export { explicitReturnTypesRuleBroker } from './brokers/rule/explicit-return-types/explicit-return-types-rule-broker';
export { requireContractValidationRuleBroker } from './brokers/rule/require-contract-validation/require-contract-validation-rule-broker';
export { questmaestroConfigBroker } from './brokers/config/questmaestro/questmaestro-config-broker';
export { tsconfigBroker } from './brokers/config/tsconfig/tsconfig-broker';

// Export transformers for advanced usage
export { mergeConfigsTransformer } from './transformers/merge-configs/merge-configs-transformer';
export { astToViolationTransformer } from './transformers/ast-to-violation/ast-to-violation-transformer';
export { ruleToConfigTransformer } from './transformers/rule-to-config/rule-to-config-transformer';

import { startEslintPlugin } from './startup/start-eslint-plugin';

// Default export for standard ESLint plugin usage
const plugin = startEslintPlugin();
export default plugin;
