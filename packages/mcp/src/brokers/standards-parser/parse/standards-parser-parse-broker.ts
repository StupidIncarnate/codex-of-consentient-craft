/**
 * PURPOSE: Parses markdown standards files into addressable sections by ## headers
 *
 * USAGE:
 * const sections = await standardsParserParseBroker({ section: 'testing-standards/proxy-architecture' });
 * // Returns sections filtered by section parameter, or all sections if no filter
 *
 * METADATA: Reads from packages/standards/**\/*.md, splits by ## headers, builds section paths
 */

import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { standardsSectionContract } from '../../../contracts/standards-section/standards-section-contract';
import type { StandardsSection } from '../../../contracts/standards-section/standards-section-contract';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { markdownParserStatics } from '../../../statics/markdown-parser/markdown-parser-statics';
import type { HeaderInfo } from '../../../contracts/header-info/header-info-contract';
import { lineIndexContract } from '../../../contracts/line-index/line-index-contract';
import { headerTextContract } from '../../../contracts/header-text/header-text-contract';

export const standardsParserParseBroker = async ({
  section,
}: {
  section?: string;
}): Promise<StandardsSection[]> => {
  const pattern = globPatternContract.parse('packages/standards/**/*.md');
  const cwd = filePathContract.parse(process.cwd());

  const files = await globFindAdapter({
    pattern,
    cwd,
  });

  // Process files in parallel for better performance
  const fileSectionPromises = files.map(async (filepath) => {
    const contents = await fsReadFileAdapter({ filepath });

    const lines = contents.split('\n');
    const headerIndices: HeaderInfo[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (line?.startsWith(markdownParserStatics.headerPrefix.level2)) {
        const headerText = line.slice(markdownParserStatics.headerPrefix.length);
        headerIndices.push({
          lineIndex: lineIndexContract.parse(lineIndex),
          headerText: headerTextContract.parse(headerText),
        });
      }
    }

    const fileSections: StandardsSection[] = [];
    for (let headerIdx = 0; headerIdx < headerIndices.length; headerIdx++) {
      const currentHeader = headerIndices[headerIdx];
      const nextHeader = headerIndices[headerIdx + 1];

      if (!currentHeader) {
        continue;
      }

      const startLine = currentHeader.lineIndex;
      const endLine = nextHeader ? nextHeader.lineIndex : lines.length;

      const sectionLines = lines.slice(startLine, endLine);
      const sectionContent = sectionLines.join('\n');

      const filename = filepath.split('/').pop()?.replace('.md', '') ?? '';
      const headerSlug = currentHeader.headerText.toLowerCase().split(' ').join('-');
      const sectionPath = `${filename}/${headerSlug}`;

      const sectionData = standardsSectionContract.parse({
        section: sectionPath,
        content: sectionContent,
        path: `${filepath}#${headerSlug}`,
      });

      fileSections.push(sectionData);
    }

    return fileSections;
  });

  const allFileSections = await Promise.all(fileSectionPromises);
  const sections = allFileSections.flat();

  if (section) {
    return sections.filter((s) => s.section === section);
  }

  return sections;
};
