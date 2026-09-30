/**
 * PURPOSE: Main entry point for the @dungeonmaster/eslint-plugin package exporting rules, configs, and contracts
 *
 * USAGE:
 * import plugin from '@dungeonmaster/eslint-plugin';
 * // Returns ESLint plugin with all rules and configurations
 */
export { StartEslintPlugin } from './startup/start-eslint-plugin';

// Export contracts for advanced usage
export type { TsconfigOptions } from './contracts/tsconfig-options/tsconfig-options-contract';

// Export adapters for writing custom rule tests

// Export brokers for custom configurations
export { ruleBanPrimitivesBroker } from './brokers/rule/ban-primitives/rule-ban-primitives-broker';
export { ruleEnforceContractUsageInTestsBroker } from './brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker';
export { ruleRequireZodOnPrimitivesBroker } from './brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker';
export { ruleRequireContractValidationBroker } from './brokers/rule/require-contract-validation/rule-require-contract-validation-broker';
export { configDungeonmasterBroker } from './brokers/config/dungeonmaster/config-dungeonmaster-broker';
export {
  dungeonmasterRuleEnforceOnStatics,
  folderConfigStatics,
} from '@dungeonmaster/shared/statics';
export { configTsconfigBroker } from './brokers/config/tsconfig/config-tsconfig-broker';

// Export transformers for advanced usage
export { mergeConfigsTransformer } from './transformers/merge-configs/merge-configs-transformer';

import { StartEslintPlugin } from './startup/start-eslint-plugin';

// Default export for standard ESLint plugin usage
const plugin = StartEslintPlugin();
export default plugin;
