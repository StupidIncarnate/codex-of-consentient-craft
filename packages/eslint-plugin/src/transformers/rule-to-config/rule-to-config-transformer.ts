import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';

export const ruleToConfigTransformer = ({
  ruleName,
  severity = 'error',
}: {
  ruleName: string;
  severity?: 'off' | 'warn' | 'error';
}): EslintConfig => ({
  rules: {
    [ruleName]: severity,
  },
});
