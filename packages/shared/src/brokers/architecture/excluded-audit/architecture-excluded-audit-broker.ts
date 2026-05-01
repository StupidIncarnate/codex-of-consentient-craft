/**
 * PURPOSE: Renders the Excluded categories audit section of the project-map for a package —
 * lists files in guards/, transformers/, contracts/, and assets/ that were filtered out of
 * the trace by projectMapStatics.excludedFolders, so readers know what was suppressed.
 *
 * USAGE:
 * const section = architectureExcludedAuditBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/shared'),
 *   packageName: contentTextContract.parse('shared'),
 * });
 * // Returns markdown with --- separator + ## Excluded categories heading + fenced code block
 *
 * WHEN-TO-USE: As part of the project-map per-package renderer — every package gets this section
 * WHEN-NOT-TO-USE: When the package has no src/ directory
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';
import { listFilesRecursiveLayerBroker } from './list-files-recursive-layer-broker';

const SECTION_HEADER = '## Excluded categories — files filtered out of the trace by configuration';
const SECTION_DESCRIPTION =
  "These categories are deliberately omitted from every trace by the project-map tool's filter (not absent from the path — they were on the path and the filter dropped them). Listed here so you know what's been suppressed and can re-include any subset by adjusting the filter.";
const NONE_LABEL = '(none on this path)';

export const architectureExcludedAuditBroker = ({
  packageRoot,
  packageName,
}: {
  packageRoot: AbsoluteFilePath;
  packageName: ContentText;
}): ContentText => {
  const srcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const columnWidth = projectMapStatics.excludedAuditColumnWidth;

  const codeLines: ContentText[] = [];

  for (const folder of projectMapStatics.excludedFolders) {
    const folderPath = absoluteFilePathContract.parse(`${String(srcPath)}/${folder}`);
    const files = listFilesRecursiveLayerBroker({ dirPath: folderPath });

    const label = `${folder}/`;
    const padding = ' '.repeat(columnWidth - label.length);

    if (files.length === 0) {
      codeLines.push(contentTextContract.parse(`${label}${padding}${NONE_LABEL}`));
    } else {
      const [firstFile, ...remainingFiles] = files;
      if (firstFile !== undefined) {
        const symbolName = filePathToSymbolNameTransformer({ filePath: firstFile });
        codeLines.push(
          contentTextContract.parse(
            `${label}${padding}${String(packageName)}/${folder}/${String(symbolName)}`,
          ),
        );
      }
      const continuationIndent = ' '.repeat(columnWidth);
      for (const file of remainingFiles) {
        const symbolName = filePathToSymbolNameTransformer({ filePath: file });
        codeLines.push(
          contentTextContract.parse(
            `${continuationIndent}${String(packageName)}/${folder}/${String(symbolName)}`,
          ),
        );
      }
    }
  }

  const codeBlock = codeLines.map((l) => String(l)).join('\n');

  return contentTextContract.parse(
    `---\n\n${SECTION_HEADER}\n\n${SECTION_DESCRIPTION}\n\n\`\`\`\n${codeBlock}\n\`\`\``,
  );
};
