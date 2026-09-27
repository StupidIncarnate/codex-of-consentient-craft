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

import { typescriptSourceFileGetterAdapter } from '../../adapters/typescript/source-file-getter/typescript-source-file-getter-adapter';
import { typescriptAstToMockCallsAdapter } from '../../adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter';
import { typescriptAstToModuleMockCallsAdapter } from '../../adapters/typescript/ast-to-module-mock-calls/typescript-ast-to-module-mock-calls-adapter';
import { typescriptAstToProxyImportsAdapter } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import { proxyReexportNamesResolveMiddleware } from '../proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware';
import { pathDirnameAdapter } from '../../adapters/path/dirname/path-dirname-adapter';
import { pathResolveAdapter } from '../../adapters/path/resolve/path-resolve-adapter';
import { moduleNameContract } from '../../contracts/module-name/module-name-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { IdentifierName } from '../../contracts/identifier-name/identifier-name-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type { TypescriptProgram } from '../../contracts/typescript-program/typescript-program-contract';
import type { ProxyMockQueueEntry } from '../../contracts/proxy-mock-queue-entry/proxy-mock-queue-entry-contract';

export const proxyMockCollectorMiddleware = ({
  proxyFilePath,
  program,
  requestedNames = null,
}: {
  proxyFilePath: FilePath;
  program: TypescriptProgram;
  requestedNames?: IdentifierName[] | null;
}): MockCall[] => {
  const visitedKeys = new Set();
  const mockCalls: MockCall[] = [];
  const filesToProcess: ProxyMockQueueEntry[] = [{ filePath: proxyFilePath, requestedNames }];

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

    const sourceFile = typescriptSourceFileGetterAdapter({ program, filePath: entry.filePath });
    if (!sourceFile) {
      continue;
    }

    const mocks = [
      ...typescriptAstToMockCallsAdapter({ sourceFile }),
      ...typescriptAstToModuleMockCallsAdapter({ sourceFile }),
    ];

    // Resolve relative module names to absolute paths so they work when hoisted
    // to test files in different directories
    const resolvedMocks = mocks.map((mock) => {
      if (!mock.moduleName.startsWith('.')) {
        return mock;
      }
      const sourceDir = pathDirnameAdapter({ filePath: entry.filePath });
      const absoluteModuleName = pathResolveAdapter({ paths: [sourceDir, mock.moduleName] });
      return { ...mock, moduleName: moduleNameContract.parse(absoluteModuleName) };
    });

    mockCalls.push(...resolvedMocks);

    const edges = typescriptAstToProxyImportsAdapter({ sourceFile });
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
        filesToProcess.push({ filePath: nextPath, requestedNames: edge.names });
        continue;
      }

      // A `reexport` edge is part of entry.filePath's OWN re-export surface — follow it only for
      // the names entry's own requestedNames constraint still needs.
      if (entry.requestedNames === null) {
        filesToProcess.push({ filePath: nextPath, requestedNames: edge.names });
        continue;
      }

      if (edge.names === null) {
        const provided = proxyReexportNamesResolveMiddleware({
          filePath: nextPath,
          candidateNames: entry.requestedNames,
          program,
        });
        if (provided.length > 0) {
          filesToProcess.push({ filePath: nextPath, requestedNames: provided });
        }
        continue;
      }

      const overlap = edge.names.filter((name) => entry.requestedNames?.includes(name));
      if (overlap.length > 0) {
        filesToProcess.push({ filePath: nextPath, requestedNames: overlap });
      }
    }
  }

  return mockCalls;
};
