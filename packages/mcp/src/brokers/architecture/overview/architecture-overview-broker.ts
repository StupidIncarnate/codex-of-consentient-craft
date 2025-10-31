/**
 * PURPOSE: Generate orientation map for LLMs entering the repo with folder types, architecture layers, decision tree, and critical rules
 *
 * USAGE:
 * const markdown = architectureOverviewBroker();
 * // Returns ContentText markdown with folder types table, layer diagram, decision tree, and critical rules
 *
 * WHEN-TO-USE: When LLMs need a high-level overview of the project structure and architecture
 */
import { folderConfigStatics } from '@questmaestro/shared/statics';
import { folderConfigContract, type FolderConfig } from '@questmaestro/shared/contracts';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { folderDependencyTreeTransformer } from '../../../transformers/folder-dependency-tree/folder-dependency-tree-transformer';

export const architectureOverviewBroker = (): ContentText => {
  const { hierarchy } = folderDependencyTreeTransformer({
    folderConfigs: folderConfigStatics,
  });

  // Build folder types table using entries sorted by depth
  type FolderEntry = [
    keyof typeof folderConfigStatics,
    (typeof folderConfigStatics)[keyof typeof folderConfigStatics],
  ];

  const folderEntries = (Object.entries(folderConfigStatics) as FolderEntry[]).sort(
    ([_nameA, configA], [_nameB, configB]) => {
      const depthDiff = configA.folderDepth - configB.folderDepth;
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return _nameA.localeCompare(_nameB);
    },
  );

  const tableHeader = contentTextContract.parse(
    '| Folder | Purpose | Depth | When to Use |\n|--------|---------|-------|-------------|',
  );
  const tableRows: ContentText[] = [tableHeader];

  for (const [folderName, rawConfig] of folderEntries) {
    const config: FolderConfig = folderConfigContract.parse(rawConfig);

    tableRows.push(
      contentTextContract.parse(
        `| ${folderName}/ | ${config.meta.purpose} | ${config.folderDepth} | ${config.meta.whenToUse} |`,
      ),
    );
  }

  const folderTypesTable = tableRows.join('\n');

  // Build architecture layer diagram (using hierarchy from transformer)
  const layerDiagram = `\`\`\`
${hierarchy}
\`\`\``;

  // Build decision tree from metadata (using same folder order, excluding non-code folders)
  const decisionTreeLines: ContentText[] = [];
  let decisionIndex = 1;

  for (const [folderName, rawConfig] of folderEntries) {
    const config: FolderConfig = folderConfigContract.parse(rawConfig);

    // Skip assets and migrations from decision tree (not code folders)
    if (folderName === 'assets' || folderName === 'migrations') {
      continue;
    }

    decisionTreeLines.push(
      contentTextContract.parse(`${decisionIndex}. ${config.meta.whenToUse} → ${folderName}/`),
    );
    decisionIndex++;
  }

  const decisionTree = contentTextContract.parse(`\`\`\`\n${decisionTreeLines.join('\n')}\n\`\`\``);

  // Build critical rules
  const criticalRules = `**Never do these things (❌):**
- ❌ Use while (true) - use recursion instead
- ❌ Import from implementation files across folders - only import entry files
- ❌ Use raw primitives (string, number) - use branded Zod types
- ❌ Create utils/, helpers/, common/, shared/ folders
- ❌ Use console.log() in CLI - use process.stdout.write()
- ❌ Use delete with computed keys - use Reflect.deleteProperty()

**Always do these things (✅):**
- ✅ Use object destructuring for function parameters
- ✅ Explicit return types for all exported functions
- ✅ Co-locate test files with implementation
- ✅ Use async/await over .then() chains
- ✅ File names in kebab-case
- ✅ Metadata comments (PURPOSE/USAGE) at top of implementation files`;

  // Combine all sections
  const markdown = `# Architecture Overview

## Folder Types

${folderTypesTable}

## Architecture Layer Diagram

${layerDiagram}

## Decision Tree: Where Does Code Go?

${decisionTree}

## Critical Rules Summary

${criticalRules}
`;

  return contentTextContract.parse(markdown);
};
