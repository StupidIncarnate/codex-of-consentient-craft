/**
 * PURPOSE: Groups a flat list of ESLint rule names by their dash-prefix.
 * Returns an ordered list of groups preserving insertion order per prefix.
 *
 * USAGE:
 * const groups = ruleNamesGroupByPrefixTransformer({
 *   ruleNames: [ContentTextStub({ value: 'ban-primitives' }), ContentTextStub({ value: 'enforce-project-structure' })],
 * });
 * // Returns [{ prefix: ContentText('ban'), names: [ContentText('ban-primitives')] }, ...]
 *
 * WHEN-TO-USE: eslint-plugin headline broker building the rules-section grouped display
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { RulePrefixGroup } from '../../contracts/rule-prefix-group/rule-prefix-group-contract';
import { rulePrefixExtractTransformer } from '../rule-prefix-extract/rule-prefix-extract-transformer';

export const ruleNamesGroupByPrefixTransformer = ({
  ruleNames,
}: {
  ruleNames: ContentText[];
}): RulePrefixGroup[] => {
  const prefixOrder: ContentText[] = [];
  const prefixGroups = new Map<ContentText, ContentText[]>();

  for (const ruleName of ruleNames) {
    const prefix = rulePrefixExtractTransformer({ ruleName });
    const prefixStr = String(prefix);

    const existingKey = prefixOrder.find((p) => String(p) === prefixStr);

    if (existingKey === undefined) {
      const branded = contentTextContract.parse(prefixStr);
      prefixOrder.push(branded);
      prefixGroups.set(branded, [ruleName]);
    } else {
      prefixGroups.get(existingKey)?.push(ruleName);
    }
  }

  return prefixOrder.map((prefix) => ({
    prefix,
    names: prefixGroups.get(prefix) ?? [],
  }));
};
