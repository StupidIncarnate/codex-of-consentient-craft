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
import type { TreeOutput } from '../../../contracts/tree-output/tree-output-contract';

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

  return {
    results: treeOutput,
    count: resultCountContract.parse(fileResults.length),
  };
};
