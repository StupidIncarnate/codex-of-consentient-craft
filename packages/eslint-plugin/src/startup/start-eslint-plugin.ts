import { banPrimitivesRuleBroker } from '../brokers/rule/ban-primitives/ban-primitives-rule-broker';
import { requireZodOnPrimitivesRuleBroker } from '../brokers/rule/require-zod-on-primitives/require-zod-on-primitives-rule-broker';
import { explicitReturnTypesRuleBroker } from '../brokers/rule/explicit-return-types/explicit-return-types-rule-broker';
import { enforceProjectStructureRuleBroker } from '../brokers/rule/enforce-project-structure/enforce-project-structure-rule-broker';
import { enforceImportDependenciesRuleBroker } from '../brokers/rule/enforce-import-dependencies/enforce-import-dependencies-rule-broker';
import { enforceObjectDestructuringParamsRuleBroker } from '../brokers/rule/enforce-object-destructuring-params/enforce-object-destructuring-params-rule-broker';
import { enforceTestColocationRuleBroker } from '../brokers/rule/enforce-test-colocation/enforce-test-colocation-rule-broker';
import { enforceImplementationTestingRuleBroker } from '../brokers/rule/enforce-implementation-testing/enforce-implementation-testing-rule-broker';
import { questmaestroConfigBroker } from '../brokers/config/questmaestro/questmaestro-config-broker';
import type { Rule } from '../adapters/eslint/eslint-rule-adapter';
import type { EslintConfig } from '../contracts/eslint-config/eslint-config-contract';

export const startEslintPlugin = (): {
  readonly rules: {
    readonly 'ban-primitives': Rule.RuleModule;
    readonly 'require-zod-on-primitives': Rule.RuleModule;
    readonly 'explicit-return-types': Rule.RuleModule;
    readonly 'enforce-project-structure': Rule.RuleModule;
    readonly 'enforce-import-dependencies': Rule.RuleModule;
    readonly 'enforce-object-destructuring-params': Rule.RuleModule;
    readonly 'enforce-test-colocation': Rule.RuleModule;
    readonly 'enforce-implementation-testing': Rule.RuleModule;
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
      'enforce-project-structure': enforceProjectStructureRuleBroker(),
      'enforce-import-dependencies': enforceImportDependenciesRuleBroker(),
      'enforce-object-destructuring-params': enforceObjectDestructuringParamsRuleBroker(),
      'enforce-test-colocation': enforceTestColocationRuleBroker(),
      'enforce-implementation-testing': enforceImplementationTestingRuleBroker(),
    },
    configs: {
      questmaestro: questmaestroConfigBroker(),
    },
  }) as const;
