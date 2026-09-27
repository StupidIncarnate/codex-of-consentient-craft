/**
 * PURPOSE: Enforces that proxies create all child proxies based on implementation file imports. A
 * gateway import's expected proxy is the WRAPPER's own `.proxy` file, colocated beside it and
 * imported per file (`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`) —
 * derived from the subpath's own production barrel (`<subpath>.ts`, which every subpath always has),
 * which names the exact relative path per wrapped export. There is no `_test_` barrel to fall back
 * on: a name the production barrel re-exports from a wrapper folder ONE level below it is WRAPPED and
 * needs a proxy at that wrapper's own `.proxy` path; a name reached only through `export * from
 * '<npm-or-node-module>'`, or through a `../` climb into a DIFFERENT subpath's own folder, is a
 * PASS-THROUGH (or that other subpath's own concern) and needs none.
 *
 * USAGE:
 * const rule = ruleEnforceProxyChildCreationBroker();
 * // Returns ESLint rule that ensures proxy creates child proxy for each dependency imported by implementation
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsEnsureReadFileSyncAdapter } from '../../../adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { parseImplementationImportsTransformer } from '../../../transformers/parse-implementation-imports/parse-implementation-imports-transformer';
import type { FileContents, Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { identifierContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { proxyNameToImplementationNameTransformer } from '../../../transformers/proxy-name-to-implementation-name/proxy-name-to-implementation-name-transformer';
import { proxyPathToImplementationPathTransformer } from '../../../transformers/proxy-path-to-implementation-path/proxy-path-to-implementation-path-transformer';
import { gatewayBarrelPathTransformer } from '../../../transformers/gateway-barrel-path/gateway-barrel-path-transformer';
import { gatewayBarrelWrapperPathsTransformer } from '../../../transformers/gateway-barrel-wrapper-paths/gateway-barrel-wrapper-paths-transformer';
import { fileExtensionsStatics, gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const ruleEnforceProxyChildCreationBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce that proxies create all child proxies based on implementation file imports',
      },
      messages: {
        missingProxyImport:
          'Implementation imports {{implementationName}} but proxy does not import its corresponding proxy from {{proxyPath}}.',
        missingProxyCreation:
          'Implementation imports {{implementationName}} but proxy does not create {{proxyName}} in constructor.',
        phantomProxyCreation:
          'Proxy creates {{proxyName}} but {{implementationFile}} does not import {{implementationName}}. Remove the phantom proxy creation or add the import to the implementation.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const { filename } = ctx;

    // Only check .proxy.ts files
    if (
      !hasFileSuffixGuard({ ...(filename ? { filename: String(filename) } : {}), suffix: 'proxy' })
    ) {
      return {};
    }

    // Derive implementation file path (handles both .proxy.ts and .proxy.tsx)
    const implementationPath = filename
      ? proxyPathToImplementationPathTransformer({ proxyPath: filename })
      : '';

    // Read implementation file (checks existence and reads in one operation)
    const implementationFileResult = ((): FileContents | null => {
      try {
        return fsEnsureReadFileSyncAdapter({
          filePath: filePathContract.parse(implementationPath),
          encoding: 'utf-8',
        });
      } catch {
        return null;
      }
    })();

    if (implementationFileResult === null) {
      // Implementation file doesn't exist or cannot be read, skip validation
      return {};
    }

    // Parse implementation imports
    const implementationImports = parseImplementationImportsTransformer({
      content: implementationFileResult,
      implementationFilePath: implementationPath,
    });

    // Track proxy imports and creation calls
    const proxyImports = new Map<Identifier, ModulePath>(); // proxyName -> importPath
    const proxyCreationCalls = new Set<Identifier>(); // proxyName
    let insideProxyFunction = false;
    let foundReturnStatement = false;

    return {
      // Track proxy file imports
      ImportDeclaration: (node: Tsestree): void => {
        const source = node.source?.value;
        if (typeof source !== 'string') return;

        // Track .proxy imports (relative paths)
        // Also track scoped package imports (@scope/pkg/folderType, or the '#gateway/...'
        // import-alias form) that contain Proxy exports
        const isProxyImport = source.endsWith('.proxy');
        const isScopedPackageImport =
          source.startsWith('@') || source.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

        if (!isProxyImport && !isScopedPackageImport) {
          return;
        }

        const imports = astGetImportsTransformer({ node });
        for (const [name, importPath] of imports) {
          // For scoped packages, only track imports ending with 'Proxy'
          if (isScopedPackageImport && !name.endsWith('Proxy')) {
            continue;
          }
          proxyImports.set(name, importPath);
        }
      },

      // Track proxy creation calls
      CallExpression: (node: Tsestree): void => {
        if (!insideProxyFunction) return;
        if (foundReturnStatement) return;

        const { callee } = node;
        if (!callee) return;

        if (callee.type === 'Identifier') {
          const calleeName = callee.name;
          if (calleeName?.endsWith('Proxy')) {
            proxyCreationCalls.add(calleeName);
          }
        }
      },

      // Track when we enter the proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: Tsestree): void => {
          const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
          for (const ancestor of ancestors) {
            if (ancestor.type === 'VariableDeclarator') {
              const ancestorId = ancestor.id;
              if (ancestorId?.name?.endsWith('Proxy')) {
                insideProxyFunction = true;
                foundReturnStatement = false;
                break;
              }
            }
          }
        },

      // Track when we exit the proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression:exit':
        (): void => {
          insideProxyFunction = false;
          foundReturnStatement = false;
        },

      // Track return statements
      ReturnStatement: (): void => {
        if (insideProxyFunction) {
          foundReturnStatement = true;
        }
      },

      // Validate at the end
      'Program:exit': (node: Tsestree): void => {
        // Check 1: For each implementation import, verify proxy has corresponding import and creation
        for (const [importedName, importPath] of implementationImports) {
          // Derive expected proxy name and path
          const expectedProxyNameString = `${importedName}Proxy`;
          const expectedProxyName = identifierContract.parse(expectedProxyNameString);

          // For scoped package imports (@scope/pkg/folderType), proxy is exported from
          // @scope/pkg/testing; a gateway import's proxy sits beside its own wrapper (below).
          // For relative imports, proxy is at path.proxy
          const isScopedPackageImport =
            importPath.startsWith('@') ||
            importPath.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

          // A gateway import (#gateway/node/fs__promises, @scope/npm/zod, ...) names the gateway
          // folder as the second path segment and the subpath as the third.
          const importPathSegments = isScopedPackageImport ? importPath.split('/') : [];
          const [, gatewayFolderSegment, gatewaySubpathSegment] = importPathSegments;
          const isGatewayImport =
            gatewayFolderSegment !== undefined &&
            Object.values(gatewayLocationsStatics.folders).some(
              (folder) => folder === gatewayFolderSegment,
            );

          // Every gateway package holds pass-throughs alongside its wrapped exports — not only
          // npm (zod's `z`, react's `useState`, ...), but node too (`join` from @scope/node/path
          // is Node's own `path.join`, untouched, because `path` does no I/O and needs no guard).
          // A pass-through export has no proxy at all, so only a name the subpath's own PRODUCTION
          // barrel actually re-exports from a wrapper folder one level below it is held to this
          // check — there is no `_test_` barrel to read instead. The wrapper's own proxy sits
          // beside it (`<folder>/<folder>.proxy.ts`), which is the per-file path a caller's proxy
          // is expected to import directly.
          const expectedProxyPath = ((): ModulePath | null => {
            if (isGatewayImport) {
              const barrelPath =
                gatewaySubpathSegment === undefined
                  ? null
                  : gatewayBarrelPathTransformer({
                      callerFilePath: filePathContract.parse(String(filename ?? '')),
                      gatewayFolder: gatewayFolderSegment,
                      subpath: gatewaySubpathSegment,
                    });

              const wrapperPaths = ((): Map<Identifier, ModulePath> => {
                if (barrelPath === null) {
                  return new Map<Identifier, ModulePath>();
                }
                const barrelContent = ((): FileContents | null => {
                  try {
                    return fsEnsureReadFileSyncAdapter({
                      filePath: barrelPath,
                      encoding: 'utf-8',
                    });
                  } catch {
                    return null;
                  }
                })();
                return barrelContent === null
                  ? new Map<Identifier, ModulePath>()
                  : gatewayBarrelWrapperPathsTransformer({ content: barrelContent });
              })();

              const relativeWrapperPath = wrapperPaths.get(importedName);
              if (relativeWrapperPath === undefined) {
                // Pass-through: no local wrapper exists, or is expected, for this name.
                return null;
              }

              const [scopeSegment, packageFolder, subpath] = importPathSegments;
              return `${scopeSegment}/${packageFolder}/${subpath}/${relativeWrapperPath}.proxy` as ModulePath;
            }
            if (isScopedPackageImport) {
              const lastSlashIndex = importPath.lastIndexOf('/');
              const basePath =
                lastSlashIndex > 0 ? importPath.substring(0, lastSlashIndex) : importPath;
              return `${basePath}/testing` as ModulePath;
            }
            // Check for any TypeScript extension (.ts, .tsx) and replace with .proxy
            const tsExtension = fileExtensionsStatics.source.typescript.find((ext) =>
              importPath.endsWith(ext),
            );
            return (
              tsExtension === undefined
                ? `${importPath}.proxy`
                : importPath.replace(tsExtension, '.proxy')
            ) as ModulePath;
          })();

          if (expectedProxyPath === null) {
            continue;
          }

          // Check if proxy imports the corresponding proxy
          const hasProxyImport = Array.from(proxyImports.keys()).some(
            (name) => name === expectedProxyName,
          );

          if (!hasProxyImport) {
            ctx.report({
              node,
              messageId: 'missingProxyImport',
              data: {
                implementationName: importedName,
                proxyPath: expectedProxyPath,
              },
            });
            continue;
          }

          // Check if proxy creates the child proxy in constructor
          const hasProxyCreation = proxyCreationCalls.has(expectedProxyName);

          if (!hasProxyCreation) {
            ctx.report({
              node,
              messageId: 'missingProxyCreation',
              data: {
                implementationName: importedName,
                proxyName: expectedProxyName,
              },
            });
          }
        }

        // Check 2: For each proxy creation, verify implementation imports the dependency (phantom check)
        for (const proxyName of proxyCreationCalls) {
          // Derive implementation name from proxy name
          // e.g., httpAdapterProxy -> httpAdapter
          const implementationName = proxyNameToImplementationNameTransformer({ proxyName });

          // Check if implementation imports this dependency
          const hasImplementationImport = implementationImports.has(implementationName);

          if (!hasImplementationImport) {
            // Get implementation filename for error message
            const implementationFile =
              filename?.split('/').pop()?.replace('.proxy.ts', '.ts') ?? 'implementation';

            ctx.report({
              node,
              messageId: 'phantomProxyCreation',
              data: {
                proxyName,
                implementationFile,
                implementationName,
              },
            });
          }
        }
      },
    };
  },
});
