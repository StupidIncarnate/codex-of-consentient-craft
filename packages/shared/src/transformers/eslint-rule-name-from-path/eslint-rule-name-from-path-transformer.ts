/**
 * PURPOSE: Extracts an ESLint rule name from a rule broker file path by returning
 * the parent directory name (the rule domain folder).
 *
 * USAGE:
 * const name = eslintRuleNameFromPathTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts'),
 * });
 * // Returns ContentText('ban-primitives')
 *
 * WHEN-TO-USE: eslint-plugin headline broker converting rule file paths to rule names
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { projectMapHeadlineEslintPluginStatics } from '../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

export const eslintRuleNameFromPathTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText => {
  const parts = String(filePath).split('/');
  // Parent directory name is the rule domain folder (e.g. 'ban-primitives')
  const parentDir =
    parts[parts.length - projectMapHeadlineEslintPluginStatics.ruleNameParentDirDepth] ?? '';
  return contentTextContract.parse(parentDir);
};
