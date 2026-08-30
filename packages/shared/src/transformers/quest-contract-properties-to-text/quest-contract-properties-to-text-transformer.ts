/**
 * PURPOSE: Renders quest contract properties as indented text lines
 *
 * USAGE:
 * questContractPropertiesToTextTransformer({properties: [{name: 'email', type: 'EmailAddress'}], depth: 1});
 * // Returns: ContentText[] with indented property lines
 *
 * A PROPERTY'S OWN `source` RENDERS IN BRACKETS, and only when it has one. A contract's `source` is
 * one-to-one but a contract is one-to-many: a property naming a file in another package is routed
 * to THAT package by `questContractSourceOwnerTransformer`, and a render that drops the path leaves
 * the session it was routed to with no way to see why it owns the line.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { QuestContractProperty } from '../../contracts/quest-contract-property/quest-contract-property-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';

export const questContractPropertiesToTextTransformer = ({
  properties,
  depth,
}: {
  properties: readonly QuestContractProperty[];
  depth: number;
}): ContentText[] => {
  const lines: ContentText[] = [];
  const prefix = textDisplaySymbolsStatics.indent.repeat(depth);

  for (const prop of properties) {
    const propParts = [String(prop.name)];
    if (prop.type) {
      propParts.push(`: ${String(prop.type)}`);
    }
    if (prop.value) {
      propParts.push(` = "${String(prop.value)}"`);
    }
    if (prop.optional) {
      propParts.push(' (optional)');
    }
    if (prop.source) {
      propParts.push(` [${String(prop.source)}]`);
    }
    if (prop.description) {
      propParts.push(` ${textDisplaySymbolsStatics.emDash} ${String(prop.description)}`);
    }
    lines.push(contentTextContract.parse(`${prefix}${propParts.join('')}`));
    if (prop.properties && prop.properties.length > 0) {
      lines.push(
        ...questContractPropertiesToTextTransformer({
          properties: prop.properties,
          depth: depth + 1,
        }),
      );
    }
  }

  return lines;
};
