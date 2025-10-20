import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsEnsureReadFileSyncAdapter } from '../../../adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';

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
  create: (context: unknown) => {
    const ctx = context as EslintContext;
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
    let implementationContent: string;
    try {
      implementationContent = fsEnsureReadFileSyncAdapter({
        filePath: implementationPath as never,
        encoding: 'utf-8',
      });
    } catch {
      // Implementation file doesn't exist or cannot be read, skip validation
      return {};
    }

    // Parse implementation imports
    const implementationImports = parseImplementationImports(implementationContent);

    // Track proxy imports and creation calls
    const proxyImports = new Map<string, string>(); // proxyName -> importPath
    const proxyCreationCalls = new Set<string>(); // proxyName
    let insideProxyFunction = false;
    let foundReturnStatement = false;

    return {
      // Track proxy file imports
      ImportDeclaration: (node: Tsestree): void => {
        const source = node.source?.value;
        if (typeof source !== 'string') return;

        // Only track .proxy imports
        if (!source.endsWith('.proxy')) {
          return;
        }

        const imports = astGetImportsTransformer({ node });
        for (const [name, importPath] of imports) {
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
          if (calleeName !== undefined && calleeName.endsWith('Proxy')) {
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
              ancestor !== null &&
              'type' in ancestor &&
              'id' in ancestor &&
              ancestor.type === 'VariableDeclarator'
            ) {
              const ancestorId = Reflect.get(ancestor, 'id') as Tsestree | null | undefined;
              if (ancestorId?.name !== undefined && ancestorId.name.endsWith('Proxy')) {
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
          const expectedProxyName = `${importedName}Proxy`;
          const expectedProxyPath = importPath.endsWith('.ts')
            ? importPath.replace('.ts', '.proxy')
            : `${importPath}.proxy`;

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
          const implementationName = proxyName.replace(/Proxy$/, '');

          // Check if implementation imports this dependency
          const hasImplementationImport = implementationImports.has(implementationName);

          if (!hasImplementationImport) {
            // Get implementation filename for error message
            const implementationFile =
              filename?.split('/').pop()?.replace('.proxy.ts', '.ts') || 'implementation';

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

// Parse implementation file to extract architectural component imports
const parseImplementationImports = (content: string): Map<string, string> => {
  const imports = new Map<string, string>();

  // Strip comments before parsing to avoid false positives from example code
  // Remove multi-line comments (/* ... */)
  let contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line comments (// ...)
  contentWithoutComments = contentWithoutComments.replace(/\/\/.*$/gm, '');

  // Simple regex to match import statements
  // Matches: import { name } from 'path' or import name from 'path'
  const importRegex = /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(contentWithoutComments)) !== null) {
    const namedImports = match[1];
    const defaultImport = match[2];
    const importPath = match[3];

    if (!importPath) {
      continue;
    }

    // Skip npm packages (relative imports start with . or ..)
    if (!importPath.startsWith('.')) {
      continue;
    }

    // Skip contract imports (they're just types)
    if (importPath.endsWith('-contract') || importPath.endsWith('.stub')) {
      continue;
    }

    // Skip statics imports (they don't need proxies)
    if (importPath.endsWith('-statics')) {
      continue;
    }

    // Skip multi-dot files except .proxy (like .test.ts, .stub.ts already filtered above)
    const filename = importPath.split('/').pop() || '';
    const dotCount = (filename.match(/\./g) || []).length;
    if (dotCount > 0 && !importPath.endsWith('.proxy')) {
      continue;
    }

    // Check if this import's folder type requires a proxy based on folderConfigStatics
    // Extract folder type from import path by searching backwards through path parts
    const pathParts = importPath.split('/');
    const folderTypes = Object.keys(folderConfigStatics);
    let folderTypeFromPath: string | null = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (part && folderTypes.includes(part)) {
        folderTypeFromPath = part;
        break;
      }
    }
    const folderConfig = folderTypeFromPath
      ? (Reflect.get(folderConfigStatics, folderTypeFromPath) as
          | { requireProxy?: boolean }
          | undefined)
      : undefined;

    // Skip if folder type doesn't require proxies
    if (folderConfig?.requireProxy !== true) {
      continue;
    }

    // This is an architectural component that needs a proxy
    // Extract imported names
    if (namedImports) {
      const names = namedImports
        .split(',')
        .map((n) => n.trim().split(/\s+as\s+/)[0])
        .filter((n): n is string => Boolean(n));
      for (const name of names) {
        imports.set(name, importPath);
      }
    }

    if (defaultImport) {
      imports.set(defaultImport, importPath);
    }
  }

  return imports;
};
