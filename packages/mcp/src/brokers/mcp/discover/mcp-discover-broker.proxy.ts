/**
 * PURPOSE: Proxy for mcp-discover-broker that composes file-scanner broker proxy, plus the glob
 * gateway proxy directly for this broker's OWN directory-hint probe (mcp-discover-broker.ts
 * calls the glob gateway itself for that one, so composing its proxy here is legitimate —
 * `enforce-proxy-child-creation` refuses a proxy that composes a gateway its own implementation
 * never imports, which is why read-file staging always goes through fileScannerBrokerProxy
 * instead: only file-scanner-broker.ts imports `readFile`). Every `pattern` param here is the
 * SUFFIX (e.g. `'**\/*.ts'`), the same convention fileScannerBrokerProxy's own `setupFiles` uses
 * — never the full `${rootPath}/${globSuffix}` the broker computes internally — because
 * `globResolveTransformer` leaves an already-wildcarded glob unchanged (no trailing `/**\/*`
 * appended), so only the real transformer's output, not a hand-guessed one, is safe to stage.
 *
 * USAGE:
 * const brokerProxy = mcpDiscoverBrokerProxy();
 * brokerProxy.setupFileDiscovery({ filepath, contents, pattern });
 * // Sets up file scanner broker to return metadata
 */

import { fileScannerBrokerProxy } from '../../file/scanner/file-scanner-broker.proxy';
import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';

// Placeholder content for a file glob genuinely matched but grep then filters out — any real
// content works here, as long as it never contains a grep pattern a setupGrepFilteredEmpty
// caller stages (checked against every mcp-discover-broker.test.ts use).
const NON_GREP_MATCHING_CONTENTS = 'export const placeholder = true;';

export const mcpDiscoverBrokerProxy = (): {
  setupFileDiscovery: (params: { filepath: string; contents: string; pattern: string }) => void;
  setupMultipleFileDiscovery: (params: {
    files: readonly { filepath: string; contents: string }[];
    pattern: string;
  }) => void;
  setupEmptyWithDirectoryHits: (params: {
    directoryPaths: readonly string[];
    pattern: string;
  }) => void;
  setupGrepFilteredEmpty: (params: { filePaths: readonly string[]; pattern: string }) => void;
  setupFileDiscoveryAtRoot: (params: {
    rootPath: string;
    filepath: string;
    contents: string;
    pattern: string;
  }) => void;
} => {
  // The scan root the tests pass for both fileScannerBroker's own scan and this broker's
  // own directory-hint probe.
  const scanRoot = '/default/cwd';
  const fileScannerProxy = fileScannerBrokerProxy();
  const globGateway = globProxy();

  return {
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: string;
      contents: string;
      pattern: string;
    }): void => {
      fileScannerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
    },

    setupMultipleFileDiscovery: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: string; contents: string }[];
      pattern: string;
    }): void => {
      fileScannerProxy.setupFiles({ files, pattern });
    },

    setupEmptyWithDirectoryHits: ({
      directoryPaths,
      pattern,
    }: {
      directoryPaths: readonly string[];
      pattern: string;
    }): void => {
      // The scanner's own file scan finds nothing (staged through fileScannerProxy, which owns
      // the read-file gateway too); this hint's OWN directory probe is the one direct glob call
      // mcp-discover-broker.ts itself makes, at the SAME full pattern (root + suffix, computed
      // here the way the broker computes it) but addressed by nodir (false) — the only thing
      // distinguishing it from the scan's own call (nodir: true).
      fileScannerProxy.setupFiles({ files: [], pattern });
      globGateway.returnsMatchingTail({
        pattern: `${scanRoot}/${pattern}`,
        options: { nodir: false },
        matches: [...directoryPaths],
      });
    },

    setupGrepFilteredEmpty: ({
      filePaths,
      pattern,
    }: {
      filePaths: readonly string[];
      pattern: string;
    }): void => {
      // The scanner's own file scan and this hint's file-hit probe reach the gateway's glob with
      // IDENTICAL arguments — same pattern, same nodir — so they cannot be told apart by address
      // and must share one answer: glob genuinely matches these files. Staging them through
      // fileScannerProxy.setupFiles (rather than composing the glob and read-file gateways here
      // directly) answers both calls with that one sticky stage AND stages the read content; the
      // placeholder content, never matching whatever grep pattern a test asks for, is what makes
      // the scan's own post-grep-filter result come back empty.
      fileScannerProxy.setupFiles({
        files: filePaths.map((filepath) => ({ filepath, contents: NON_GREP_MATCHING_CONTENTS })),
        pattern,
      });
    },

    setupFileDiscoveryAtRoot: ({
      rootPath,
      filepath,
      contents,
      pattern,
    }: {
      rootPath: string;
      filepath: string;
      contents: string;
      pattern: string;
    }): void => {
      fileScannerProxy.setupFilesAtRoot({ rootPath, files: [{ filepath, contents }], pattern });
    },
  };
};
