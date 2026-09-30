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
 * A bare workspace-package ROOT import (`import { StartOrchestrator } from '@dungeonmaster/orchestrator'`,
 * or `@acme/orders` in a published consumer — no folder-type subpath at all) resolves the same way,
 * against that OTHER package's own root barrel (`packages/<pkg>/src/index.ts`) instead of a gateway
 * subpath barrel — brands doc T6, EPIC concession 2. A name that barrel re-exports from a relative
 * sibling is held to this check only when THAT sibling's own `.proxy.ts` exists on disk: most
 * package-root exports (contracts, statics, guards) never ship one, so this is what tells a
 * package's own composed startup object (which does) apart from everything else it exports (which
 * does not) — never a hardcoded folder type, and never a hardcoded package name. THE SCOPE ITSELF
 * IS NEVER HARDCODED EITHER: this package ships to consumers whose own workspace packages carry
 * their own scope, never `@dungeonmaster`, so `create()` reads it off the REAL workspace root's own
 * package.json `name` (`workspaceRootFindBroker`, the same ordinary broker
 * `enforce-gateway-config-names-exist` also imports) before this check ever runs — never off root
 * `dependencies`/`devDependencies`, whose `@dungeonmaster/*` tooling entries a fresh consumer's own
 * scope would otherwise lose to (F13).
 *
 * A `@scope/pkg/<folderType>` import (`@dungeonmaster/shared/brokers`) resolves the same way against
 * that package's own folder barrel (`packages/<pkg>/src/<folderType>/<folderType>.ts`): the name's
 * wrapper path becomes the per-file proxy specifier the caller's proxy should import.
 *
 * With the `banWrapperMocks` option on, a proxy OUTSIDE the gateway packages may not
 * `registerMock({ fn })` a gateway wrapper (a name the subpath barrel re-exports from a wrapper
 * folder that ships its own proxy) — it composes that wrapper's proxy instead. A pass-through name
 * (`join`, `randomUUID`) stays mockable. The option is off until every package reads clean.
 *
 * USAGE:
 * const rule = ruleEnforceProxyChildCreationBroker();
 * // Returns ESLint rule that ensures proxy creates child proxy for each dependency imported by implementation
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { readFileSyncIfExists, existsSync } from '#gateway/node/fs';
import { dirname } from '#gateway/node/path';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { parseImplementationImportsTransformer } from '../../../transformers/parse-implementation-imports/parse-implementation-imports-transformer';
import { proxyNameToImplementationNameTransformer } from '../../../transformers/proxy-name-to-implementation-name/proxy-name-to-implementation-name-transformer';
import { isAstNodeDirectlyInFunctionGuard } from '../../../guards/is-ast-node-directly-in-function/is-ast-node-directly-in-function-guard';
import { proxyPathToImplementationPathTransformer } from '../../../transformers/proxy-path-to-implementation-path/proxy-path-to-implementation-path-transformer';
import { gatewayBarrelPathTransformer } from '../../../transformers/gateway-barrel-path/gateway-barrel-path-transformer';
import { barrelWrapperPathsReadBroker } from '../../barrel-wrapper-paths/read/barrel-wrapper-paths-read-broker';
import { packageRootSourcePathTransformer } from '../../../transformers/package-root-source-path/package-root-source-path-transformer';
import { workspaceFolderBarrelProxyPathTransformer } from '../../../transformers/workspace-folder-barrel-proxy-path/workspace-folder-barrel-proxy-path-transformer';
import { workspaceScopeFromRootNameTransformer } from '@dungeonmaster/shared/transformers';
import { workspaceRootFindBroker } from '../../workspace-root/find/workspace-root-find-broker';
import { fileExtensionsStatics, gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const ruleEnforceProxyChildCreationBroker = (): TSESLint.RuleModule<
  'missingProxyImport' | 'missingProxyCreation' | 'phantomProxyCreation' | 'composeWrapperProxy'
> => ({
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
      composeWrapperProxy:
        '"{{name}}" is a gateway wrapper with its own proxy. Compose {{name}}Proxy from its own file instead of mocking it directly with registerMock.',
    },
    schema: [
      {
        type: 'object',
        properties: { banWrapperMocks: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      options?: { banWrapperMocks?: boolean }[];
    };
    const { filename } = ctx;
    const banWrapperMocks = ctx.options[0]?.banWrapperMocks === true;

    // Only check .proxy.ts files
    if (!hasFileSuffixGuard({ ...(filename ? { filename } : {}), suffix: 'proxy' })) {
      return {};
    }

    // Derive implementation file path (handles both .proxy.ts and .proxy.tsx)
    const implementationPath = filename
      ? proxyPathToImplementationPathTransformer({ proxyPath: filename })
      : '';

    // Ban: a proxy outside the gateway packages that `registerMock({ fn })`s a gateway wrapper.
    // Only the wrapper's own proxy, inside the gateway, stages the outside call it wraps.
    const gatewayImportPaths = new Map<string, string>(); // local name -> gateway import path
    const isWrapperMockCheckActive =
      banWrapperMocks && filename !== '' && !filename.includes('/packages/@gateway/');

    const wrapperMockListeners = {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        if (!isWrapperMockCheckActive) return;
        for (const [name, importPath] of astGetImportsTransformer({ node })) {
          gatewayImportPaths.set(name, importPath);
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        if (!isWrapperMockCheckActive) return;
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.Identifier || callee.name !== 'registerMock') return;
        const [firstArg] = node.arguments;
        if (firstArg?.type !== AST_NODE_TYPES.ObjectExpression) return;

        for (const prop of firstArg.properties) {
          if (
            prop.type !== AST_NODE_TYPES.Property ||
            prop.key.type !== AST_NODE_TYPES.Identifier ||
            prop.key.name !== 'fn' ||
            prop.value.type !== AST_NODE_TYPES.Identifier
          ) {
            continue;
          }
          const mockedName = prop.value.name;
          const importPath = gatewayImportPaths.get(mockedName);
          if (importPath === undefined) continue;

          // `#gateway/<folder>/<subpath>` (or the `@scope/<folder>/<subpath>` form): the subpath's
          // own barrel says whether the name is a wrapper or a pass-through.
          const [, folder, subpath] = importPath.split('/');
          const isGatewayPath =
            importPath.startsWith(`${gatewayLocationsStatics.importPrefix}/`) ||
            importPath.startsWith('@');
          if (
            !isGatewayPath ||
            folder === undefined ||
            subpath === undefined ||
            !Object.values(gatewayLocationsStatics.folders).some((known) => known === folder)
          ) {
            continue;
          }
          const wrapperPaths = barrelWrapperPathsReadBroker({
            barrelPath: gatewayBarrelPathTransformer({
              callerFilePath: filename,
              gatewayFolder: folder,
              subpath,
            }),
          });
          if (wrapperPaths.has(mockedName)) {
            ctx.report({
              node: prop,
              messageId: 'composeWrapperProxy',
              data: { name: mockedName },
            });
          }
        }
      },
    };

    // Read implementation file, treating a missing or unreadable file the same way (skip)
    const implementationFileResult = ((): string | null => {
      try {
        const rawContents = readFileSyncIfExists(implementationPath);
        return rawContents === null ? null : rawContents;
      } catch {
        return null;
      }
    })();

    if (implementationFileResult === null) {
      // Implementation file doesn't exist or cannot be read, skip the child-proxy validation; the
      // wrapper-mock ban reads only the proxy file itself.
      return wrapperMockListeners;
    }

    // THIS workspace's own npm scope, read off the real workspace root's own package.json `name` —
    // never hardcoded, and never scanned off `dependencies`/`devDependencies`. `@dungeonmaster/orchestrator`
    // and a published consumer's own `@acme/orders` both resolve through this one call; a repo with no
    // discoverable workspace root yields undefined, and every bare-root check below then safely skips
    // rather than matching nothing or matching the wrong scope.
    const workspaceScope = filename
      ? workspaceScopeFromRootNameTransformer({
          rootPackageJsonName: workspaceRootFindBroker({
            startDir: dirname(filename),
          })?.rootPackageJsonName,
        })
      : undefined;

    // Parse implementation imports
    const implementationImports = parseImplementationImportsTransformer({
      content: implementationFileResult,
      implementationFilePath: implementationPath,
      ...(workspaceScope === undefined ? {} : { workspaceScope }),
    });

    // Track proxy imports and creation calls
    const proxyImports = new Map<string, string>(); // proxyName -> importPath
    const proxyCreationCalls = new Set<string>(); // proxyName
    let currentProxyFunctionNode: TSESTree.Node | null = null;

    return {
      // Track proxy file imports
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        wrapperMockListeners.ImportDeclaration(node);
        const source = node.source.value;
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

      // Track proxy creation calls. A call counts as "created" when it sits directly in the proxy
      // function's own body — a statement before return, OR part of the returned value's own
      // expression (`return { ...childProxy() }`, same as the implicit-return
      // `() => ({ ...childProxy() })`) — but NOT nested inside a further function the returned
      // object exposes as a method, which is deferred rather than eager.
      CallExpression: (node: TSESTree.CallExpression): void => {
        wrapperMockListeners.CallExpression(node);
        if (currentProxyFunctionNode === null) return;

        const { callee } = node;

        if (callee.type === AST_NODE_TYPES.Identifier) {
          const calleeName = callee.name;
          if (
            calleeName.endsWith('Proxy') &&
            isAstNodeDirectlyInFunctionGuard({ node, functionNode: currentProxyFunctionNode })
          ) {
            proxyCreationCalls.add(calleeName);
          }
        }
      },

      // Track when we enter the proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: TSESTree.ArrowFunctionExpression): void => {
          const ancestors = ctx.sourceCode.getAncestors(node);
          for (const ancestor of ancestors) {
            if (ancestor.type === AST_NODE_TYPES.VariableDeclarator) {
              const ancestorId = ancestor.id;
              if (
                ancestorId.type === AST_NODE_TYPES.Identifier &&
                ancestorId.name.endsWith('Proxy')
              ) {
                currentProxyFunctionNode = node;
                break;
              }
            }
          }
        },

      // Track when we exit the proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression:exit':
        (): void => {
          currentProxyFunctionNode = null;
        },

      // Validate at the end
      'Program:exit': (node: TSESTree.Program): void => {
        // Check 1: For each implementation import, verify proxy has corresponding import and creation
        for (const [importedName, importPath] of implementationImports) {
          // Derive expected proxy name and path
          const expectedProxyNameString = `${importedName}Proxy`;
          const expectedProxyName = expectedProxyNameString;

          // A scoped or gateway import's proxy sits beside the file its name comes from (below).
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

          // A bare workspace-package ROOT import — '@dungeonmaster/orchestrator', or '@acme/orders'
          // in a published consumer — no subpath at all, every real caller reaches a package's own
          // composed export this way. Exactly 2 segments (scope + package name), the package name is
          // not one of the four gateway folders (those are gateway imports, handled above), and the
          // scope matches THIS workspace's own — read off the real workspace root above, never
          // hardcoded — so a repo with no discoverable scope never falls into this branch at all.
          const isWorkspacePackageRootImport =
            isScopedPackageImport &&
            !isGatewayImport &&
            gatewayFolderSegment !== undefined &&
            gatewaySubpathSegment === undefined &&
            workspaceScope !== undefined &&
            importPathSegments[0] === workspaceScope;

          // Every gateway package holds pass-throughs alongside its wrapped exports — not only
          // npm (zod's `z`, react's `useState`, ...), but node too (`join` from @scope/node/path
          // is Node's own `path.join`, untouched, because `path` does no I/O and needs no guard).
          // A pass-through export has no proxy at all, so only a name the subpath's own PRODUCTION
          // barrel actually re-exports from a wrapper folder one level below it is held to this
          // check — there is no `_test_` barrel to read instead. The wrapper's own proxy sits
          // beside it (`<folder>/<folder>.proxy.ts`), which is the per-file path a caller's proxy
          // is expected to import directly.
          const expectedProxyPath = ((): string | null => {
            if (isGatewayImport) {
              const barrelPath =
                gatewaySubpathSegment === undefined
                  ? null
                  : gatewayBarrelPathTransformer({
                      callerFilePath: filename,
                      gatewayFolder: gatewayFolderSegment,
                      subpath: gatewaySubpathSegment,
                    });

              const wrapperPaths = barrelWrapperPathsReadBroker({ barrelPath });

              const relativeWrapperPath = wrapperPaths.get(importedName);
              if (relativeWrapperPath === undefined) {
                // Pass-through: no local wrapper exists, or is expected, for this name.
                return null;
              }

              const [scopeSegment, packageFolder, subpath] = importPathSegments;
              return `${scopeSegment}/${packageFolder}/${subpath}/${relativeWrapperPath}.proxy` as string;
            }
            if (isWorkspacePackageRootImport) {
              // TS narrows gatewayFolderSegment to `string` here via aliased-condition analysis —
              // isWorkspacePackageRootImport's own definition already conjuncts
              // `gatewayFolderSegment !== undefined`.
              const packageName = gatewayFolderSegment;

              // Read the OTHER package's own root barrel (src/index.ts) — the one place a bare
              // root import's name is mapped to the file it actually comes from, the same
              // technique gatewayBarrelWrapperPathsTransformer already applies to a gateway
              // subpath's barrel (see its own PURPOSE — both are "which sibling file does this
              // name re-export from").
              const barrelPath = packageRootSourcePathTransformer({
                callerFilePath: filename,
                packageName,
                relativePath: 'index.ts',
              });

              const wrapperPaths = barrelWrapperPathsReadBroker({ barrelPath });

              const relativeWrapperPath = wrapperPaths.get(importedName);
              if (relativeWrapperPath === undefined) {
                // Not re-exported via a single-name relative line at all (a multi-name grouped
                // export, or an external contract re-exported from @dungeonmaster/shared) —
                // nothing local to compose a proxy from.
                return null;
              }

              // The real mapping, never a hardcoded folder type: only a name whose OWN file
              // ships a colocated `.proxy.ts` on disk is held to this check. Most package-root
              // exports (contracts, statics, guards, transformers) never do, so this is what
              // tells `StartOrchestrator` (proxy at startup/start-orchestrator.proxy.ts) apart
              // from `agentRoleContract` (no proxy — contracts use stubs) without this rule ever
              // naming either one.
              const wrapperProxyPath = packageRootSourcePathTransformer({
                callerFilePath: filename,
                packageName,
                relativePath: `${relativeWrapperPath}.proxy.ts`,
              });
              const hasWrapperProxy = wrapperProxyPath !== null && existsSync(wrapperProxyPath);
              if (!hasWrapperProxy) {
                return null;
              }

              return workspaceFolderBarrelProxyPathTransformer({ importPath, relativeWrapperPath });
            }
            if (isScopedPackageImport) {
              // `@scope/pkg/<folderType>`: the package's own folder barrel maps the name to the
              // file it re-exports, and the caller imports that file's proxy directly. A barrel
              // that cannot be read leaves the by-name check in force against the barrel's path.
              const [, packageName, folderType] = importPathSegments;
              const relativeWrapperPath =
                packageName === undefined || folderType === undefined
                  ? undefined
                  : barrelWrapperPathsReadBroker({
                      barrelPath: packageRootSourcePathTransformer({
                        callerFilePath: filename,
                        packageName,
                        relativePath: `${folderType}/${folderType}.ts`,
                      }),
                    }).get(importedName);
              return relativeWrapperPath === undefined
                ? importPath
                : workspaceFolderBarrelProxyPathTransformer({ importPath, relativeWrapperPath });
            }
            // Check for any TypeScript extension (.ts, .tsx) and replace with .proxy
            const tsExtension = fileExtensionsStatics.source.typescript.find((ext) =>
              importPath.endsWith(ext),
            );
            return (
              tsExtension === undefined
                ? `${importPath}.proxy`
                : importPath.replace(tsExtension, '.proxy')
            ) as string;
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
              filename.split('/').pop()?.replace('.proxy.ts', '.ts') ?? 'implementation';

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
