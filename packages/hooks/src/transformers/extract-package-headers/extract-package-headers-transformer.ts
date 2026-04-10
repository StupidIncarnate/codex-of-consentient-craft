/**
 * PURPOSE: Extracts package name and description headers from a full project map and formats as a compact list
 *
 * USAGE:
 * const summary = extractPackageHeadersTransformer({ projectMap: fullMapContent });
 * // Returns ContentText with markdown list: "## Packages\n\n- **cli** — CLI description"
 *
 * WHEN-TO-USE: When generating a compact packages snippet from the full project map output
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { projectMapStatics } from '@dungeonmaster/shared/statics';

const packageHeaderPattern = /^## (\S+) \(\d+ files\)/u;

export const extractPackageHeadersTransformer = ({
  projectMap,
}: {
  projectMap: ContentText;
}): ContentText => {
  const lines = String(projectMap).split('\n');
  const headers: ContentText[] = [];

  for (const line of lines) {
    const match = packageHeaderPattern.exec(line);

    if (match) {
      const name = contentTextContract.parse(match[1] ?? '');
      const separatorIndex = line.indexOf(projectMapStatics.descriptionSeparator);
      const description =
        separatorIndex >= 0
          ? contentTextContract.parse(
              line.slice(separatorIndex + projectMapStatics.descriptionSeparator.length + 1),
            )
          : contentTextContract.parse('');

      const suffix =
        description.length > 0 ? ` ${projectMapStatics.descriptionSeparator} ${description}` : '';

      headers.push(contentTextContract.parse(`- **${name}**${suffix}`));
    }
  }

  return contentTextContract.parse(`## Packages\n\n${headers.join('\n')}`);
};
