/**
 * PURPOSE: Enforces that proxies create all child proxies based on implementation file imports
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
          'Proxy imports {{implementationName}} but does not import its corresponding proxy from {{proxyPath}}.',
        missingProxyCreation:
          'Proxy imports {{implementationName}} but does not create {{proxyName}} in constructor.',
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

    // Derive implementation file path
    const implementationPath = filename ? filename.replace('.proxy.ts', '.ts') : '';

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
        // Also track scoped package imports (@scope/pkg/folderType) that contain Proxy exports
        const isProxyImport = source.endsWith('.proxy');
        const isScopedPackageImport = source.startsWith('@');

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
            // Type guard: check if ancestor is a Tsestree node with VariableDeclarator type
            if (
              typeof ancestor === 'object' &&
              'type' in ancestor &&
              'id' in ancestor &&
              ancestor.type === 'VariableDeclarator'
            ) {
              const ancestorId = Reflect.get(ancestor, 'id') as Tsestree | null | undefined;
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

          // For scoped package imports (@scope/pkg/folderType), proxy is exported from @scope/pkg/testing
          // For relative imports, proxy is at path.proxy
          const isScopedPackageImport = importPath.startsWith('@');
          const expectedProxyPath = ((): ModulePath => {
            if (isScopedPackageImport) {
              const lastSlashIndex = importPath.lastIndexOf('/');
              const basePath =
                lastSlashIndex > 0 ? importPath.substring(0, lastSlashIndex) : importPath;
              return `${basePath}/testing` as ModulePath;
            }
            return (
              importPath.endsWith('.ts')
                ? importPath.replace('.ts', '.proxy')
                : `${importPath}.proxy`
            ) as ModulePath;
          })();

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
