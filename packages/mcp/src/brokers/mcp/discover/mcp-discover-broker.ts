/**
 * PURPOSE: Main orchestration broker that discovers files in the codebase with metadata
 *
 * USAGE:
 * const result = await mcpDiscoverBroker({ input: DiscoverInputStub({ glob: '**\/*.ts' }) });
 * // Returns { results: DiscoverResultItem[] | TreeOutput, count: ResultCount }
 */

import { discoverInputContract } from '../../../contracts/discover-input/discover-input-contract';
import type { DiscoverInput } from '../../../contracts/discover-input/discover-input-contract';
import { discoverResultItemContract } from '../../../contracts/discover-result-item/discover-result-item-contract';
import type { DiscoverResultItem } from '../../../contracts/discover-result-item/discover-result-item-contract';
import { resultCountContract } from '../../../contracts/result-count/result-count-contract';
import type { ResultCount } from '../../../contracts/result-count/result-count-contract';
import { fileScannerBroker } from '../../file/scanner/file-scanner-broker';
import { treeFormatterTransformer } from '../../../transformers/tree-formatter/tree-formatter-transformer';
import { treeOutputContract } from '../../../contracts/tree-output/tree-output-contract';
import type { TreeOutput } from '../../../contracts/tree-output/tree-output-contract';
import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { globResolveTransformer } from '../../../transformers/glob-resolve/glob-resolve-transformer';
import { pathToTreeRelativeTransformer } from '../../../transformers/path-to-tree-relative/path-to-tree-relative-transformer';
import { discoverHintStatics } from '../../../statics/discover-hint/discover-hint-statics';

export const mcpDiscoverBroker = async ({
  input,
}: {
  input: DiscoverInput;
}): Promise<{
  results: DiscoverResultItem[] | TreeOutput;
  count: ResultCount;
}> => {
  // Validate input
  const validated = discoverInputContract.parse(input);

  // Scan files with glob/grep/context
  const fileResults = await fileScannerBroker({
    ...(validated.glob && { glob: validated.glob }),
    ...(validated.grep && { grep: validated.grep }),
    ...(validated.context !== undefined && { context: validated.context }),
  });

  // Map FileMetadata to DiscoverResultItem format (fileType -> type, signature.raw -> signature)
  const resultItems = fileResults.map((file) =>
    discoverResultItemContract.parse({
      name: file.name,
      path: file.path,
      type: file.fileType,
      purpose: file.purpose,
      usage: file.usage,
      signature: file.signature?.raw,
      relatedFiles: file.relatedFiles,
      ...(file.hits && { hits: file.hits }),
    }),
  );

  // verbose === true → return full DiscoverResultItem[]
  if (validated.verbose === true) {
    return {
      results: resultItems,
      count: resultCountContract.parse(resultItems.length),
    };
  }

  // Tree format for non-verbose queries
  const treeItems = fileResults.map((file) => ({
    name: file.name,
    type: file.fileType,
    purpose: file.purpose,
    path: file.path,
    ...(file.hits && { hits: file.hits }),
  }));

  const treeOutput = treeFormatterTransformer({ items: treeItems });

  // Empty-result hint: if a glob was provided and no files matched, probe for directories
  // that DO match with includeDirectories=true. If any are found, tell the caller to append `/**`.
  if (fileResults.length === 0 && validated.glob) {
    const cwdPath = filePathContract.parse(process.cwd());
    const globSuffix = globResolveTransformer({ glob: validated.glob });
    const pattern = globPatternContract.parse(`${cwdPath}/${globSuffix}`);
    const directoryHits = await globFindAdapter({
      pattern,
      cwd: cwdPath,
      includeDirectories: true,
    });

    // Keep only directory entries — glob still returns both when includeDirectories is true.
    const matchedDirs = directoryHits.filter(
      (p) => !p.endsWith('.ts') && !p.endsWith('.tsx') && !p.endsWith('.js') && !p.endsWith('.jsx'),
    );

    if (matchedDirs.length > 0) {
      const dirRelatives = matchedDirs
        .slice(0, discoverHintStatics.maxDirectoriesShown)
        .map((p) => pathToTreeRelativeTransformer({ filepath: p }));
      const hintLines = [
        discoverHintStatics.header,
        '',
        discoverHintStatics.explanation,
        discoverHintStatics.suggestion,
        ...dirRelatives.map((d) => `  ${d}/`),
      ];
      return {
        results: treeOutputContract.parse(hintLines.join('\n')),
        count: resultCountContract.parse(0),
      };
    }
  }

  return {
    results: treeOutput,
    count: resultCountContract.parse(fileResults.length),
  };
};
