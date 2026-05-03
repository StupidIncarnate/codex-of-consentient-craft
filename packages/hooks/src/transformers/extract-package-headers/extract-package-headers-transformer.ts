/**
 * PURPOSE: Extracts package name headers from a full project map and formats as a compact list
 *
 * USAGE:
 * const summary = extractPackageHeadersTransformer({ projectMap: fullMapContent });
 * // Returns ContentText with markdown list: "## Packages\n\n- **cli**"
 *
 * WHEN-TO-USE: When generating a compact packages snippet from the full project map output
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

const packageHeaderPattern = /^# (\S+) \[/u;

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
      headers.push(contentTextContract.parse(`- **${name}**`));
    }
  }

  return contentTextContract.parse(`## Packages\n\n${headers.join('\n')}`);
};
