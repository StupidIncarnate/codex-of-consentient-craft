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

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { folderPurposeTransformer } from '../../../transformers/folder-purpose/folder-purpose-transformer';
import { folderConstraintsTransformer } from '../../../transformers/folder-constraints/folder-constraints-transformer';
import { fileSuffixFormatterTransformer } from '../../../transformers/file-suffix-formatter/file-suffix-formatter-transformer';
import { firstFileSuffixTransformer } from '../../../transformers/first-file-suffix/first-file-suffix-transformer';

export const architectureFolderDetailBroker = ({
  folderType,
  supplementalConstraints,
}: {
  folderType: FolderType;
  supplementalConstraints?: ContentText;
}): ContentText => {
  // Look up config from statics using type-safe key check
  if (!isKeyOfGuard(folderType, folderConfigStatics)) {
    return contentTextContract.parse(
      `# Unknown Folder Type: ${folderType}\n\nNo configuration found for this folder type.`,
    );
  }

  // Now TypeScript knows folderType is a valid key - we can safely access it
  // The as keyof typeof is safe because we checked with isKeyOfGuard above
  const rawConfig = folderConfigStatics[folderType as keyof typeof folderConfigStatics];

  // Parse and validate config through contract - explicitly type to satisfy ESLint
  const config: FolderConfig = folderConfigContract.parse(rawConfig);

  // Build comprehensive markdown documentation
  const sections: ContentText[] = [];

  // Header
  sections.push(contentTextContract.parse(`# ${folderType}/ Folder Type\n`));

  // 1. Purpose
  sections.push(contentTextContract.parse(`## Purpose\n`));
  sections.push(folderPurposeTransformer({ folderType }));
  sections.push(contentTextContract.parse(''));

  // 2. File Structure
  sections.push(contentTextContract.parse(`## File Structure\n`));
  sections.push(contentTextContract.parse(`**Pattern:** \`${config.folderPattern}\`\n`));
  sections.push(
    contentTextContract.parse(
      `**Folder Depth:** ${config.folderDepth} level${config.folderDepth === 1 ? '' : 's'}\n`,
    ),
  );
  sections.push(contentTextContract.parse(''));

  // 3. Naming Conventions
  sections.push(contentTextContract.parse(`## Naming Conventions\n`));
  const fileSuffixText = contentTextContract.parse(
    Array.isArray(config.fileSuffix) ? config.fileSuffix.join('` or `') : config.fileSuffix,
  );
  sections.push(contentTextContract.parse(`**File Suffix:** \`${fileSuffixText}\`\n`));

  // Only include export suffix if it's defined (skip for startup, assets, migrations)
  if (config.exportSuffix) {
    sections.push(
      contentTextContract.parse(
        `**Export Suffix:** \`${config.exportSuffix}\` (${config.exportCase})\n`,
      ),
    );
  }
  sections.push(contentTextContract.parse(''));

  // 4. Import Rules
  sections.push(contentTextContract.parse(`## Import Rules\n`));

  if (config.allowedImports.length === 0) {
    sections.push(
      contentTextContract.parse('**Cannot import from any other layers** - Pure domain entities\n'),
    );
  } else if (config.allowedImports.some((imp) => imp === '*')) {
    sections.push(
      contentTextContract.parse('**Can import from anywhere** - Orchestration/startup files\n'),
    );
  } else {
    sections.push(contentTextContract.parse('**Can import from:**\n'));
    const importLines = config.allowedImports.map((imp) => `- \`${imp}\``).join('\n');
    sections.push(contentTextContract.parse(`${importLines}\n`));
  }
  sections.push(contentTextContract.parse(''));

  // 5. Required Files
  sections.push(contentTextContract.parse(`## Required Files\n`));
  sections.push(
    contentTextContract.parse(`**Proxy Required:** ${config.requireProxy ? 'Yes' : 'No'}\n`),
  );

  const firstSuffix = firstFileSuffixTransformer({ config });
  const baseName = fileSuffixFormatterTransformer({ suffix: firstSuffix });

  if (config.requireProxy) {
    sections.push(contentTextContract.parse(`- Implementation: \`{name}${firstSuffix}\`\n`));
    sections.push(contentTextContract.parse(`- Test: \`{name}${baseName}.test.ts\`\n`));
    sections.push(contentTextContract.parse(`- Proxy: \`{name}${baseName}.proxy.ts\`\n`));
  } else {
    sections.push(contentTextContract.parse(`- Implementation: \`{name}${firstSuffix}\`\n`));
    sections.push(contentTextContract.parse(`- Test: \`{name}${baseName}.test.ts\`\n`));
  }
  sections.push(contentTextContract.parse(''));

  // 6. Special Features
  sections.push(contentTextContract.parse(`## Special Features\n`));

  if (config.allowsLayerFiles) {
    sections.push(
      contentTextContract.parse(
        '**Layer Files Allowed:** Yes - Complex logic can be decomposed into `{name}-layer-{suffix}` files\n',
      ),
    );
  }

  if (config.allowRegex) {
    sections.push(contentTextContract.parse('**Regex Allowed:** Yes - Can use regex literals\n'));
  }

  if (config.disallowAdhocTypes) {
    sections.push(
      contentTextContract.parse('**Ad-hoc Types Forbidden:** All types must come from contracts\n'),
    );
  }
  sections.push(contentTextContract.parse(''));

  // 7. Critical Constraints
  sections.push(contentTextContract.parse(`## Critical Constraints\n`));

  sections.push(
    folderConstraintsTransformer({
      folderType,
      config,
      ...(supplementalConstraints && { supplementalConstraints }),
    }),
  );
  sections.push(contentTextContract.parse(''));

  // 8. Examples Link
  sections.push(contentTextContract.parse(`## Learn More\n`));
  sections.push(
    contentTextContract.parse(
      `See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.\n`,
    ),
  );

  return contentTextContract.parse(sections.join('\n'));
};
