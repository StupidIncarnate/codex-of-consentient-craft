/**
 * PURPOSE: Main orchestration broker that routes discovery requests to file-scanner or standards-parser based on input type
 *
 * USAGE:
 * const result = await mcpDiscoverBroker({ input: DiscoverInputStub({ type: 'files', fileType: FileTypeStub({ value: 'broker' }) }) });
 * // Returns { results: FileMetadata[], count: ResultCount } for files
 * // Returns { results: StandardsSection[], count: ResultCount } for standards
 *
 * RELATED: file-scanner-broker, standards-parser-broker
 */

import { discoverInputContract } from '../../../contracts/discover-input/discover-input-contract';
import type { DiscoverInput } from '../../../contracts/discover-input/discover-input-contract';
import type { FileMetadata } from '../../../contracts/file-metadata/file-metadata-contract';
import { resultCountContract } from '../../../contracts/result-count/result-count-contract';
import type { ResultCount } from '../../../contracts/result-count/result-count-contract';
import type { StandardsSection } from '../../../contracts/standards-section/standards-section-contract';
import { fileScannerBroker } from '../../file/scanner/file-scanner-broker';
import { standardsParserParseBroker } from '../../standards-parser/parse/standards-parser-parse-broker';

export const mcpDiscoverBroker = async ({
  input,
}: {
  input: DiscoverInput;
}): Promise<{
  results: FileMetadata[] | StandardsSection[];
  count: ResultCount;
}> => {
  // Validate input
  const validated = discoverInputContract.parse(input);

  // Route based on type
  if (validated.type === 'files') {
    const results = await fileScannerBroker({
      ...(validated.path && { path: validated.path }),
      ...(validated.fileType && { fileType: validated.fileType }),
      ...(validated.search && { search: validated.search }),
      ...(validated.name && { name: validated.name }),
    });

    return {
      results: [...results],
      count: resultCountContract.parse(results.length),
    };
  }

  // Type must be 'standards' at this point
  const results = await standardsParserParseBroker({
    ...(validated.section && { section: validated.section }),
  });

  return {
    results,
    count: resultCountContract.parse(results.length),
  };
};
