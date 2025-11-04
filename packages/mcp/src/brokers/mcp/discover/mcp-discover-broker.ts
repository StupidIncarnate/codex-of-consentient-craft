/**
 * PURPOSE: Main orchestration broker that discovers files in the codebase with metadata
 *
 * USAGE:
 * const result = await mcpDiscoverBroker({ input: DiscoverInputStub({ type: 'files', fileType: FileTypeStub({ value: 'broker' }) }) });
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

  const fileResults = await fileScannerBroker({
    ...(validated.path && { path: validated.path }),
    ...(validated.fileType && { fileType: validated.fileType }),
    ...(validated.search && { search: validated.search }),
    ...(validated.name && { name: validated.name }),
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
    }),
  );

  // Auto-detect format: if name is provided, return full format; otherwise return tree format
  if (validated.name) {
    return {
      results: resultItems,
      count: resultCountContract.parse(resultItems.length),
    };
  }

  // Tree format for path/search queries
  const treeItems = fileResults.map((file) => ({
    name: file.name,
    type: file.fileType,
    purpose: file.purpose,
    path: file.path,
  }));

  const treeOutput = treeFormatterTransformer({ items: treeItems });

  return {
    results: treeOutput,
    count: resultCountContract.parse(fileResults.length),
  };
};
