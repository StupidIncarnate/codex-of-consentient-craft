export { PreEditLint } from './pre-edit-lint';
export { LintRunner } from './lint-runner';
export { MessageFormatter } from './message-formatter';

// Export individual functions from brokers/transformers for backward compatibility
export { hookConfigLoadBroker as loadHookConfig } from '../brokers/hook-config/load/hook-config-load-broker';
export { hookConfigDefaultTransformer as getPreEditLintDefaultConfig } from '../transformers/hook-config-default/hook-config-default-transformer';
export { eslintLoadConfigBroker as loadEslintConfigByFile } from '../brokers/eslint/load-config/eslint-load-config-broker';
export { eslintConfigFilterTransformer as createFilteredEslintConfig } from '../transformers/eslint-config-filter/eslint-config-filter-transformer';
export { eslintOutputParseTransformer as parseEslintOutput } from '../transformers/eslint-output-parse/eslint-output-parse-transformer';
export { eslintLintContentBroker as lintContent } from '../brokers/eslint/lint-content/eslint-lint-content-broker';
export { eslintLintContentWithFilteringBroker as lintContentWithFiltering } from '../brokers/eslint/lint-content-with-filtering/eslint-lint-content-with-filtering-broker';
export { typescriptCheckBroker as runTypescriptCheck } from '../brokers/typescript/check/typescript-check-broker';
export { violationsCountByRuleTransformer as countViolationsByRule } from '../transformers/violations-count-by-rule/violations-count-by-rule-transformer';
export { violationsFindNewTransformer as findNewViolations } from '../transformers/violations-find-new/violations-find-new-transformer';
export { violationMessageFormatTransformer as formatViolationMessage } from '../transformers/violation-message-format/violation-message-format-transformer';
export { violationsAnalyzeBroker as analyzeViolations } from '../brokers/violations/analyze/violations-analyze-broker';

export type {
  LintMessage,
  LintResult,
  ViolationCount,
  ViolationComparison,
} from '../types/lint-type';

export type { PreEditLintConfig, QuestmaestroHooksConfig } from '../types/config-type';
