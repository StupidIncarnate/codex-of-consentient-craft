/**
 * PURPOSE: Renders quest contract entries as Mermaid HTML lines with property details for embedding in node labels
 *
 * USAGE:
 * renderMermaidContractLinesTransformer({ contracts: [QuestContractEntryStub({ nodeId: 'submit-form' })] });
 * // Returns: ContentText with HTML like '<br/><small>#91;LoginCredentials#93;</small><br/><small>&nbsp;&nbsp;email: EmailAddress</small>'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { QuestContractEntry } from '../../contracts/quest-contract-entry/quest-contract-entry-contract';
import { escapeQuotedMermaidLabelTransformer } from '../escape-quoted-mermaid-label/escape-quoted-mermaid-label-transformer';
import { renderMermaidContractPropertyTransformer } from '../render-mermaid-contract-property/render-mermaid-contract-property-transformer';

export const renderMermaidContractLinesTransformer = ({
  contracts,
}: {
  contracts: readonly QuestContractEntry[];
}): ContentText =>
  contentTextContract.parse(
    contracts
      .map((contract) => {
        const escapedName = escapeQuotedMermaidLabelTransformer({
          label: contentTextContract.parse(String(contract.name)),
        });
        const headerLine = `<br/><small>#91;${escapedName}#93;</small>`;
        const propertyLines = contract.properties
          .map((property) => renderMermaidContractPropertyTransformer({ property, depth: 0 }))
          .join('');
        return `${headerLine}${propertyLines}`;
      })
      .join(''),
  );
