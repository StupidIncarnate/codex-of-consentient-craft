/**
 * PURPOSE: Extracts the prefix group from an ESLint rule name. Returns the
 * matched known prefix (ban, enforce, forbid, require, no) or 'other' as ContentText.
 *
 * USAGE:
 * const prefix = rulePrefixExtractTransformer({ ruleName: ContentTextStub({ value: 'ban-primitives' }) });
 * // Returns ContentText('ban')
 *
 * const prefix = rulePrefixExtractTransformer({ ruleName: ContentTextStub({ value: 'custom-rule' }) });
 * // Returns ContentText('other')
 *
 * WHEN-TO-USE: eslint-plugin headline broker grouping rules by name prefix
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import { projectMapHeadlineEslintPluginStatics } from '../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';

export const rulePrefixExtractTransformer = ({
  ruleName,
}: {
  ruleName: ContentText;
}): ContentText => {
  const name = String(ruleName);
  for (const prefix of projectMapHeadlineEslintPluginStatics.knownPrefixes) {
    if (name.startsWith(`${prefix}-`)) {
      return contentTextContract.parse(prefix);
    }
  }
  return contentTextContract.parse('other');
};
