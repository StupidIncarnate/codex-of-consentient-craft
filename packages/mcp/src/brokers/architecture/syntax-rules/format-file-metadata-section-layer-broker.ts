/**
 * PURPOSE: Formats the file metadata section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatFileMetadataSectionLayerBroker();
 * // Returns array of markdown lines for file metadata rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatFileMetadataSectionLayerBroker = (): MarkdownSectionLines => {
  const { fileMetadata } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## File Metadata Documentation',
    '',
    `**${fileMetadata.rule}**`,
    '',
    '**Required format:**',
    '```typescript',
    fileMetadata.requiredFormat,
    '```',
    '',
    '**Required for:**',
    ...fileMetadata.requiredFor.map((req) => `- ${req}`),
    '',
    '**Not required for:**',
    ...fileMetadata.notRequiredFor.map((notReq) => `- ${notReq}`),
    '',
    '**Optional fields:**',
    ...fileMetadata.optionalFields.map((optional) => `- ${optional}`),
    '',
    '**Example:**',
    '```typescript',
    ...fileMetadata.examples,
    '```',
    '',
    '### What Belongs in PURPOSE',
    '',
    `**${fileMetadata.purposeContent.rule}**`,
    '',
    `**${fileMetadata.purposeContent.mustNotContainIntro}**`,
    ...fileMetadata.purposeContent.mustNotContain.map((item) => `- ${item}`),
    '',
    `**${fileMetadata.purposeContent.mustContainIntro}**`,
    ...fileMetadata.purposeContent.mustContain.map((item) => `- ${item}`),
    '',
    fileMetadata.purposeContent.siblingDisambiguation,
    '',
    fileMetadata.purposeContent.writeLast,
    '',
    fileMetadata.purposeContent.usageUnchanged,
    '',
    '**Worked examples in this repo:**',
    ...fileMetadata.purposeContent.workedExamples.map((example) => `- ${example}`),
    '',
    '**Example:**',
    '```typescript',
    ...fileMetadata.purposeContent.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...fileMetadata.purposeContent.violations,
    '```',
    '',
  ]);
};
