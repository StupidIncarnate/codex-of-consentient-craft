/**
 * PURPOSE: Recursively collects jest.mock() calls from a proxy file and its dependencies. A `reexport`
 * edge (a barrel's `export ... from`) is followed only for the names the CURRENT visit's own
 * `requestedNames` constraint still needs — resolved through `proxyReexportNamesResolveMiddleware` when
 * the edge itself names nothing (`export * from`) — so a barrel's fan-out collects only the proxy
 * modules an importer actually asked for, not every file the barrel re-exports. A plain `import` edge
 * is the visited file's own internal dependency and is always followed in full, carrying down whatever
 * names IT named (or `null`, unconstrained).
 *
 * USAGE:
 * const mockCalls = proxyMockCollectorMiddleware({
 *   proxyFilePath: filePathContract.parse('/src/test.proxy.ts'),
 *   program: typescriptProgram,
 *   requestedNames: [identifierNameContract.parse('pathJoinAdapterProxy')],
 * });
 * // Returns array of MockCall objects from all proxy files in the chain
 */

import { typescriptSourceFileGetMiddleware } from '../typescript-source-file-get/typescript-source-file-get-middleware';
import { astMockCallsTransformer } from '../../transformers/ast-mock-calls/ast-mock-calls-transformer';
import { astModuleMockCallsTransformer } from '../../transformers/ast-module-mock-calls/ast-module-mock-calls-transformer';
import { astProxyImportsTransformer } from '../../transformers/ast-proxy-imports/ast-proxy-imports-transformer';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import { proxyReexportNamesResolveMiddleware } from '../proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware';
import { dirname, resolve } from '#gateway/node/path';
import { moduleNameContract } from '../../contracts/module-name/module-name-contract';
import type { IdentifierName } from '../../contracts/identifier-name/identifier-name-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type * as ts from '#gateway/npm/typescript';
import type { ProxyMockQueueEntry } from '../../contracts/proxy-mock-queue-entry/proxy-mock-queue-entry-contract';
import { proxyMockQueueEntryContract } from '../../contracts/proxy-mock-queue-entry/proxy-mock-queue-entry-contract';

export const proxyMockCollectorMiddleware = ({
  proxyFilePath,
  program,
  requestedNames = null,
}: {
  proxyFilePath: string;
  program: ts.Program | undefined;
  requestedNames?: IdentifierName[] | null;
}): MockCall[] => {
  const visitedKeys = new Set();
  const mockCalls: MockCall[] = [];
  const filesToProcess: ProxyMockQueueEntry[] = [proxyMockQueueEntryContract.parse({ filePath: proxyFilePath, requestedNames })];

  while (filesToProcess.length > 0) {
    const entry = filesToProcess.pop();
    if (!entry) {
      continue;
    }

    const visitKey = `${entry.filePath}::${
      entry.requestedNames === null ? '*' : [...entry.requestedNames].sort().join(',')
    }`;
    if (visitedKeys.has(visitKey)) {
      continue;
    }
    visitedKeys.add(visitKey);

    const sourceFile = typescriptSourceFileGetMiddleware({ program, filePath: entry.filePath });
    if (!sourceFile) {
      continue;
    }

    const mocks = [
      ...astMockCallsTransformer({ sourceFile }),
      ...astModuleMockCallsTransformer({ sourceFile }),
    ];

    // Resolve relative module names to absolute paths so they work when hoisted
    // to test files in different directories
    const resolvedMocks = mocks.map((mock) => {
      if (!mock.moduleName.startsWith('.')) {
        return mock;
      }
      const sourceDir = dirname(entry.filePath);
      const absoluteModuleName = resolve(sourceDir, mock.moduleName);
      return { ...mock, moduleName: moduleNameContract.parse(absoluteModuleName) };
    });

    mockCalls.push(...resolvedMocks);

    const edges = astProxyImportsTransformer({ sourceFile });
    for (const edge of edges) {
      const nextPath = importPathResolverMiddleware({
        sourceFilePath: entry.filePath,
        importPath: edge.importPath,
      });
      if (!nextPath) {
        continue;
      }

      if (edge.kind === 'import') {
        // The current (already-relevant) file's own internal dependency — always followed in full.
        filesToProcess.push(proxyMockQueueEntryContract.parse({ filePath: nextPath, requestedNames: edge.names }));
        continue;
      }

      // A `reexport` edge is part of entry.filePath's OWN re-export surface — follow it only for
      // the names entry's own requestedNames constraint still needs.
      if (entry.requestedNames === null) {
        filesToProcess.push(proxyMockQueueEntryContract.parse({ filePath: nextPath, requestedNames: edge.names }));
        continue;
      }

      if (edge.names === null) {
        const provided = proxyReexportNamesResolveMiddleware({
          filePath: nextPath,
          candidateNames: entry.requestedNames,
          program,
        });
        if (provided.length > 0) {
          filesToProcess.push(proxyMockQueueEntryContract.parse({ filePath: nextPath, requestedNames: provided }));
        }
        continue;
      }

      const overlap = edge.names.filter((name) => entry.requestedNames?.includes(name));
      if (overlap.length > 0) {
        filesToProcess.push(proxyMockQueueEntryContract.parse({ filePath: nextPath, requestedNames: overlap }));
      }
    }
  }

  return mockCalls;
};
