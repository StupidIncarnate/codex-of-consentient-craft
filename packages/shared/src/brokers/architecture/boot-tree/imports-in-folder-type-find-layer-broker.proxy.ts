import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';

const TS_SUFFIX = '.ts';
const TSX_SUFFIX = '.tsx';

export const importsInFolderTypeFindLayerBrokerProxy = (): {
  setupSource: ({
    sourceFile,
    content,
  }: {
    sourceFile: string;
    content: string;
  }) => void;
  setupMissing: ({ sourceFile }: { sourceFile: string }) => void;
  setupImplementation: (params: {
    fn: (filePath: string) => string;
    map?: Record<string, string>;
  }) => void;
  setupTsExists: ({ result }: { result: boolean }) => void;
  setupTsxExists: ({ result }: { result: boolean }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();
  const existsProxy = existsSyncProxy();

  // The broker resolves every relative import to a .ts candidate (and a sibling .tsx candidate)
  // with the same real, unmocked transformers it composes itself, so this stages exactly those
  // candidates instead of answering every path the same way. Defaults to "the .ts candidate is the
  // real file" — every current scenario's source is a real .ts sibling — and setupTsExists /
  // setupTsxExists override the specific candidates a later scenario needs.
  const candidates: { tsPath: string; tsxPath: string }[] = [];

  return {
    setupSource: ({
      sourceFile,
      content,
    }: {
      sourceFile: string;
      content: string;
    }): void => {
      fileProxy.setupReturns({ filePath: sourceFile, content });

      const importPaths = importStatementsExtractTransformer({ source: content });
      for (const importPath of importPaths) {
        const resolved = relativeImportResolveTransformer({ sourceFile, importPath });
        if (resolved === null) continue;

        const resolvedStr = String(resolved);
        const tsxPath = (resolvedStr.endsWith(TS_SUFFIX)
            ? `${resolvedStr.slice(0, -TS_SUFFIX.length)}${TSX_SUFFIX}`
            : `${resolvedStr}${TSX_SUFFIX}`);

        candidates.push({ tsPath: resolved, tsxPath });
        existsProxy.returns({ path: resolved, exists: true });
        existsProxy.returns({ path: tsxPath, exists: false });
      }
    },

    setupMissing: ({ sourceFile }: { sourceFile: string }): void => {
      fileProxy.setupMissing({ filePath: sourceFile });
    },

    setupImplementation: ({
      fn,
      map,
    }: {
      fn: (filePath: string) => string;
      map?: Record<string, string>;
    }): void => {
      fileProxy.setupImplementation({ fn });

      // A composing proxy driving a whole file tree by suffix has no single caller-known path to
      // key on for every candidate the recursive walk might resolve — unlike setupSource, which
      // stages each real caller's own exact candidates and carries no fallback of any kind.
      // Real fs.existsSync's own "false on anything unresolved" default answers everything this
      // scenario never described; the specific suffixes the SAME content map already knows about
      // are staged after, so they outrank the default per candidate — which is what lets a real
      // .tsx sibling the map describes win over the .ts candidate that the map does not.
      existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: false });

      if (map !== undefined) {
        const suffixes = Object.keys(map);
        existsProxy.returnsMatchingPath({
          path: (value: unknown): boolean =>
            typeof value === 'string' && suffixes.some((suffix) => value.endsWith(suffix)),
          exists: true,
        });
      }
    },

    setupTsExists: ({ result }: { result: boolean }): void => {
      for (const { tsPath } of candidates) {
        existsProxy.returns({ path: tsPath, exists: result });
      }
    },

    setupTsxExists: ({ result }: { result: boolean }): void => {
      for (const { tsxPath } of candidates) {
        existsProxy.returns({ path: tsxPath, exists: result });
      }
    },
  };
};
