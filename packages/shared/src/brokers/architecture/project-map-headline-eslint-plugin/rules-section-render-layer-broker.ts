/**
 * PURPOSE: Renders the Rules registered section for an eslint-plugin package. Groups
 * rule names by their dash-prefix (ban-, enforce-, forbid-, require-, no-, other)
 * and emits one line per group.
 *
 * USAGE:
 * const section = rulesSectionRenderLayerBroker({
 *   ruleNames: [contentTextContract.parse('ban-primitives'), contentTextContract.parse('enforce-project-structure')],
 * });
 * // Returns ContentText with ## Rules registered (N total) header + grouped lines
 *
 * WHEN-TO-USE: eslint-plugin headline broker rendering rules section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineEslintPluginStatics } from '../../../statics/project-map-headline-eslint-plugin/project-map-headline-eslint-plugin-statics';
import { ruleNamesGroupByPrefixTransformer } from '../../../transformers/rule-names-group-by-prefix/rule-names-group-by-prefix-transformer';

export const rulesSectionRenderLayerBroker = ({
  ruleNames,
}: {
  ruleNames: ContentText[];
}): ContentText => {
  const total = ruleNames.length;

  if (total === 0) {
    return contentTextContract.parse(
      `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (0 total)\n\n${projectMapHeadlineEslintPluginStatics.rulesSectionEmpty}`,
    );
  }

  const groups = ruleNamesGroupByPrefixTransformer({ ruleNames });

  const lines: ContentText[] = [
    contentTextContract.parse(
      `${projectMapHeadlineEslintPluginStatics.rulesSectionHeader} (${String(total)} total)`,
    ),
    contentTextContract.parse(''),
  ];

  for (const group of groups) {
    const prefixStr = String(group.prefix);
    const label =
      prefixStr === 'other'
        ? 'other'.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth)
        : `${prefixStr}-`.padEnd(projectMapHeadlineEslintPluginStatics.prefixLabelWidth);
    const nameList = group.names.map(String).join(', ');
    lines.push(contentTextContract.parse(`${label} (${String(group.names.length)}): ${nameList}`));
  }

  return contentTextContract.parse(lines.map(String).join('\n'));
};
