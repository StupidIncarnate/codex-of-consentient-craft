/**
 * PURPOSE: Proxy for mcp-discover-broker that composes file-scanner and standards-parser broker proxies
 *
 * USAGE:
 * const brokerProxy = mcpDiscoverBrokerProxy();
 * brokerProxy.setupFileDiscovery({ metadata: [FileMetadataStub(...)] });
 * // Sets up file scanner broker to return metadata
 *
 * RELATED: mcp-discover-broker, file-scanner-broker, standards-parser-broker
 */

import { fileScannerBrokerProxy } from '../../file/scanner/file-scanner-broker.proxy';
import { standardsParserParseBrokerProxy } from '../../standards-parser/parse/standards-parser-parse-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';

export const mcpDiscoverBrokerProxy = (): {
  setupFileDiscovery: (params: {
    filepath: FilePath;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupStandardsDiscovery: (params: { filepath: FilePath; contents: FileContents }) => void;
} => {
  const fileScannerProxy = fileScannerBrokerProxy();
  const standardsParserProxy = standardsParserParseBrokerProxy();

  return {
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: FilePath;
      contents: FileContents;
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupFileWithMetadata({ filepath, contents, pattern });
    },

    setupStandardsDiscovery: ({
      filepath,
      contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      standardsParserProxy.setupMarkdownFile({ filepath, contents });
    },
  };
};
