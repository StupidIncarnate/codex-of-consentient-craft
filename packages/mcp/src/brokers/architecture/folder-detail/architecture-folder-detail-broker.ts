/**
 * PURPOSE: Generate deep dive documentation for specific folder type with comprehensive details
 *
 * USAGE:
 * const markdown = architectureFolderDetailBroker({ folderType: FolderTypeStub({ value: 'brokers' }) });
 * // Returns branded ContentText with markdown documentation for brokers folder
 */

import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import {
  folderConfigContract,
  type FolderType,
  type FolderConfig,
} from '@dungeonmaster/shared/contracts';
import { isKeyOfGuard } from '@dungeonmaster/shared/guards';

import { folderPurposeTransformer } from '../../../transformers/folder-purpose/folder-purpose-transformer';
import { folderConstraintsTransformer } from '../../../transformers/folder-constraints/folder-constraints-transformer';
import { fileSuffixExtensionTransformer } from '../../../transformers/file-suffix-extension/file-suffix-extension-transformer';
import { fileSuffixFormatterTransformer } from '../../../transformers/file-suffix-formatter/file-suffix-formatter-transformer';
import { firstFileSuffixTransformer } from '../../../transformers/first-file-suffix/first-file-suffix-transformer';

export const architectureFolderDetailBroker = ({
  folderType,
  supplementalConstraints,
}: {
  folderType: FolderType;
  supplementalConstraints?: string;
}): string => {
  // Look up config from statics using type-safe key check
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return `# Unknown Folder Type: ${folderType}\n\nNo configuration found for this folder type.`;
  }

  // Now TypeScript knows folderType is a valid key - we can safely access it
  // The as keyof typeof is safe because we checked with isKeyOfGuard above
  const rawConfig = folderConfigStatics[folderType];

  // Parse and validate config through contract - explicitly type to satisfy ESLint
  const config: FolderConfig = folderConfigContract.parse(rawConfig);

  // Build comprehensive markdown documentation
  const sections: string[] = [];

  // Header
  sections.push(`# ${folderType}/ Folder Type\n`);

  // 1. Purpose
  sections.push(`## Purpose\n`);
  sections.push(folderPurposeTransformer({ folderType }));
  sections.push('');

  // 2. File Structure
  sections.push(`## File Structure\n`);
  sections.push(`**Pattern:** \`${config.folderPattern}\`\n`);
  sections.push(
    `**Folder Depth:** ${config.folderDepth} level${config.folderDepth === 1 ? '' : 's'}\n`,
  );
  sections.push('');

  // 3. Naming Conventions
  sections.push(`## Naming Conventions\n`);
  const fileSuffixText = Array.isArray(config.fileSuffix)
    ? config.fileSuffix.join('` or `')
    : config.fileSuffix;
  sections.push(`**File Suffix:** \`${fileSuffixText}\`\n`);

  // Only include export suffix if it's defined (skip for startup, assets, migrations)
  if (config.exportSuffix) {
    sections.push(`**Export Suffix:** \`${config.exportSuffix}\` (${config.exportCase})\n`);
  }
  sections.push('');

  // 4. Import Rules
  sections.push(`## Import Rules\n`);

  if (config.allowedImports.length === 0) {
    sections.push('**Cannot import from any other layers** - Pure domain entities\n');
  } else if (config.allowedImports.some((imp) => imp === '*')) {
    sections.push('**Can import from anywhere** - Orchestration/startup files\n');
  } else {
    sections.push('**Can import from:**\n');
    const importLines = config.allowedImports.map((imp) => `- \`${imp}\``).join('\n');
    sections.push(`${importLines}\n`);
  }
  sections.push('');

  // 5. Required Files
  sections.push(`## Required Files\n`);
  sections.push(`**Proxy Required:** ${config.requireProxy ? 'Yes' : 'No'}\n`);

  const firstSuffix = firstFileSuffixTransformer({ config });
  const baseName = fileSuffixFormatterTransformer({ suffix: firstSuffix });

  // A companion carries the implementation's own extension: `enforce-project-structure` derives the
  // expected proxy suffix from it, so a `.tsx` widget takes `.proxy.tsx` and a `.proxy.ts` fails lint.
  const extension = fileSuffixExtensionTransformer({ suffix: firstSuffix });
  const testInfix = config.testType === 'integration' ? '.integration.test' : '.test';

  sections.push(`- Implementation: \`{name}${firstSuffix}\`\n`);

  if (config.testType !== 'none') {
    sections.push(`- Test: \`{name}${baseName}${testInfix}${extension}\`\n`);
  }

  if (config.requireProxy) {
    sections.push(`- Proxy: \`{name}${baseName}.proxy${extension}\`\n`);
  }

  // The stub replaces the entry suffix rather than appending to it, so a `user-contract.ts` pairs
  // with `user.stub.ts` — `ban-contract-in-tests` sends every test import here instead.
  if (config.requireStub) {
    sections.push(`- Stub: \`{name}.stub${extension}\`\n`);
  }

  if (folderType === 'contracts') {
    sections.push(
      'A file whose every export is a type Zod cannot check (a function type, a method set, a generic) exports only types and needs no test or stub.\n',
    );
  }
  sections.push('');

  // 6. Special Features
  sections.push(`## Special Features\n`);

  if (config.allowsLayerFiles) {
    sections.push(
      '**Layer Files Allowed:** Yes - Complex logic can be decomposed into `{name}-layer-{suffix}` files\n',
    );
  }

  if (config.allowRegex) {
    sections.push('**Regex Allowed:** Yes - Can use regex literals\n');
  }

  if (config.disallowAdhocTypes) {
    sections.push('**Ad-hoc Types Forbidden:** All types must come from contracts\n');
  }
  sections.push('');

  // 7. Critical Constraints
  sections.push(`## Critical Constraints\n`);

  sections.push(
    folderConstraintsTransformer({
      folderType,
      config,
      ...(supplementalConstraints && { supplementalConstraints }),
    }),
  );
  sections.push('');

  // 8. Examples Link
  sections.push(`## Learn More\n`);
  sections.push(
    `Use \`get-architecture\` and \`get-folder-detail\` tools for detailed examples and patterns.\n`,
  );

  return sections.join('\n');
};
