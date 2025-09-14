import type { BlockingRule, PreEditLintConfig } from './types';

const DEFAULT_BLOCKING_RULES: BlockingRule[] = [
  {
    ruleId: '@typescript-eslint/no-explicit-any',
    severity: 'error',
  },
  {
    ruleId: '@typescript-eslint/ban-ts-comment',
    severity: 'error',
  },
  {
    ruleId: 'eslint-comments/no-use',
    severity: 'error',
  },
];

const DEFAULT_TIMEOUT = 10000; // 10 seconds for targeted rules

export const ConfigUtils = {
  getDefaultBlockingRules: (): BlockingRule[] => [...DEFAULT_BLOCKING_RULES],

  getDefaultConfig: (): PreEditLintConfig => ({
    blockingRules: ConfigUtils.getDefaultBlockingRules(),
    timeout: DEFAULT_TIMEOUT,
  }),

  createConfig: ({
    additionalRules = [],
    timeout = DEFAULT_TIMEOUT,
  }: {
    additionalRules?: BlockingRule[];
    timeout?: number;
  } = {}): PreEditLintConfig => ({
    blockingRules: [...DEFAULT_BLOCKING_RULES, ...additionalRules],
    timeout,
  }),
};
