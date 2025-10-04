import { banPrimitivesRuleBroker } from '../brokers/rule/ban-primitives/ban-primitives-rule-broker';
import { requireZodOnPrimitivesRuleBroker } from '../brokers/rule/require-zod-on-primitives/require-zod-on-primitives-rule-broker';
import { explicitReturnTypesRuleBroker } from '../brokers/rule/explicit-return-types/explicit-return-types-rule-broker';
import { enforceFolderStructureRuleBroker } from '../brokers/rule/enforce-folder-structure/enforce-folder-structure-rule-broker';
import { questmaestroConfigBroker } from '../brokers/config/questmaestro/questmaestro-config-broker';
import type { Rule } from '../adapters/eslint/eslint-rule';
import type { EslintConfig } from '../contracts/eslint-config/eslint-config-contract';

export const startEslintPlugin = (): {
  readonly rules: {
    readonly 'ban-primitives': Rule.RuleModule;
    readonly 'require-zod-on-primitives': Rule.RuleModule;
    readonly 'explicit-return-types': Rule.RuleModule;
    readonly 'enforce-folder-structure': Rule.RuleModule;
  };
  readonly configs: {
    readonly questmaestro: EslintConfig;
  };
} =>
  ({
    rules: {
      'ban-primitives': banPrimitivesRuleBroker(),
      'require-zod-on-primitives': requireZodOnPrimitivesRuleBroker(),
      'explicit-return-types': explicitReturnTypesRuleBroker(),
      'enforce-folder-structure': enforceFolderStructureRuleBroker(),
    },
    configs: {
      questmaestro: questmaestroConfigBroker(),
    },
  }) as const;
