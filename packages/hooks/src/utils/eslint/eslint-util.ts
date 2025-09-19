import { eslintUtilIsEslintMessage } from './eslint-util-is-eslint-message';
import { eslintUtilIsEslintResult } from './eslint-util-is-eslint-result';
import { eslintUtilParseOutput } from './eslint-util-parse-output';
import { eslintUtilLintContent } from './eslint-util-lint-content';
import { eslintUtilLintContentWithFiltering } from './eslint-util-lint-content-with-filtering';
import { eslintUtilRunTypescriptCheck } from './eslint-util-run-typescript-check';
import { eslintUtilLoadConfigByFile } from './eslint-util-load-config-by-file';
import { eslintUtilCreatFilteredConfig } from './eslint-util-create-filtered-config';

export const EslintUtil = {
  isEslintMessage: eslintUtilIsEslintMessage,
  isEslintResult: eslintUtilIsEslintResult,
  parseEslintOutput: eslintUtilParseOutput,
  lintContent: eslintUtilLintContent,
  lintContentWithFiltering: eslintUtilLintContentWithFiltering,
  runTypeScriptCheck: eslintUtilRunTypescriptCheck,
  loadConfigByFile: eslintUtilLoadConfigByFile,
  createFilteredConfig: eslintUtilCreatFilteredConfig,
};
