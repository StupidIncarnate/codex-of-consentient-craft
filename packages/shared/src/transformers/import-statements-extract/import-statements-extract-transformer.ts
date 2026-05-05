/**
 * PURPOSE: Extracts all from-paths from import statements in TypeScript source text
 *
 * USAGE:
 * const paths = importStatementsExtractTransformer({ source: contentTextContract.parse('import { foo } from "./foo";') });
 * // Returns ['./foo'] as ContentText[]
 *
 * WHEN-TO-USE: Static analysis of TypeScript source files to discover inter-file dependencies
 * without a full AST parse (v1 regex approach per project-map feature brief)
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import { templateLiteralsStripTransformer } from '../template-literals-strip/template-literals-strip-transformer';

const IMPORT_FROM_PATTERN =
  /import\s+(?:type\s+)?(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/gu;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;

export const importStatementsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const blockCommentsRemoved = String(source).replace(BLOCK_COMMENT_PATTERN, '');
  const stripped = templateLiteralsStripTransformer({
    source: contentTextContract.parse(blockCommentsRemoved),
  });
  const cleanedSource = String(stripped);
  const paths: ContentText[] = [];
  IMPORT_FROM_PATTERN.lastIndex = 0;
  let match = IMPORT_FROM_PATTERN.exec(cleanedSource);
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      paths.push(contentTextContract.parse(captured));
    }
    match = IMPORT_FROM_PATTERN.exec(cleanedSource);
  }
  return paths;
};
