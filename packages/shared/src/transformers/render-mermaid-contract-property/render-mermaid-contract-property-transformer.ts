/**
 * PURPOSE: Renders a single quest contract property as Mermaid HTML with recursive nesting support
 *
 * USAGE:
 * renderMermaidContractPropertyTransformer({ property: QuestContractPropertyStub(), depth: 0 });
 * // Returns: ContentText with HTML-escaped property line like '<br/><small>&nbsp;&nbsp;email: EmailAddress</small>'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { QuestContractProperty } from '../../contracts/quest-contract-property/quest-contract-property-contract';
import { escapeQuotedMermaidLabelTransformer } from '../escape-quoted-mermaid-label/escape-quoted-mermaid-label-transformer';

const INDENT = '&nbsp;&nbsp;';

export const renderMermaidContractPropertyTransformer = ({
  property,
  depth,
}: {
  property: QuestContractProperty;
  depth: number;
}): ContentText => {
  const indent = INDENT.repeat(depth + 1);
  const escapedName = escapeQuotedMermaidLabelTransformer({
    label: contentTextContract.parse(String(property.name)),
  });
  const escapedType = escapeQuotedMermaidLabelTransformer({
    label: contentTextContract.parse(String(property.type)),
  });
  const optionalMarker = property.optional === true ? '?' : '';
  const valueSegment =
    property.value === undefined
      ? ''
      : ` = ${escapeQuotedMermaidLabelTransformer({ label: contentTextContract.parse(String(property.value)) })}`;

  const selfLine = `<br/><small>${indent}${escapedName}${optionalMarker}: ${escapedType}${valueSegment}</small>`;

  const childLines =
    property.properties === undefined
      ? ''
      : property.properties
          .map((child) =>
            renderMermaidContractPropertyTransformer({ property: child, depth: depth + 1 }),
          )
          .join('');

  return contentTextContract.parse(`${selfLine}${childLines}`);
};
