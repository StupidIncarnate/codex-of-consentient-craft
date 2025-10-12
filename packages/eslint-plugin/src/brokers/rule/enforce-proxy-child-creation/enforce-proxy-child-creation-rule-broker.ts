import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '@typescript-eslint/utils';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/fs-read-file-sync/fs-read-file-sync-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/fs-exists-sync-adapter';

interface NodeWithSource {
  source?: {
    value?: unknown;
  };
}

interface NodeWithSpecifiers {
  specifiers?: TSESTree.Node[];
}

interface NodeWithImported {
  imported?: {
    name?: string;
  };
}

interface NodeWithLocal {
  local?: {
    name?: string;
  };
}

interface NodeWithCallee {
  callee?: TSESTree.Node;
}

interface NodeWithName {
  name?: string;
}

interface NodeWithId {
  id?: TSESTree.Node | null;
}

export const enforceProxyChildCreationRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => {
    const { filename } = context;

    // Only check .proxy.ts files
    if (!filename.endsWith('.proxy.ts')) {
      return {};
    }

    // Derive implementation file path
    const implementationPath = filename.replace('.proxy.ts', '.ts');

    // Check if implementation file exists
    if (!fsExistsSyncAdapter({ filePath: implementationPath as never })) {
      // No implementation file, skip validation
      return {};
    }

    // Read implementation file
    let implementationContent: string;
    try {
      implementationContent = fsReadFileSyncAdapter({
        filePath: implementationPath,
        encoding: 'utf-8',
      });
    } catch {
      // Cannot read file, skip validation
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
      ImportDeclaration: (node): void => {
        const importNode = node as unknown as NodeWithSource & NodeWithSpecifiers;
        const { source } = importNode;
        if (!source || typeof source.value !== 'string') return;

        const importPath = source.value;

        // Only track .proxy imports
        if (!importPath.endsWith('.proxy')) {
          return;
        }

        // Extract imported names
        const { specifiers } = importNode;
        if (!specifiers) return;

        for (const specifier of specifiers) {
          const specType = (specifier as { type: string }).type;
          if (specType === 'ImportSpecifier') {
            const importSpec = specifier as unknown as NodeWithImported & NodeWithLocal;
            const importedName = importSpec.imported?.name || importSpec.local?.name;
            if (importedName) {
              proxyImports.set(importedName, importPath);
            }
          }
        }
      },

      // Track proxy creation calls
      CallExpression: (node): void => {
        if (!insideProxyFunction) return;
        if (foundReturnStatement) return;

        const callNode = node as unknown as NodeWithCallee;
        const { callee } = callNode;
        if (!callee) return;

        const calleeType = (callee as { type: string }).type;
        if (calleeType === 'Identifier') {
          const calleeName = (callee as NodeWithName).name;
          if (calleeName?.endsWith('Proxy')) {
            proxyCreationCalls.add(calleeName);
          }
        }
      },

      // Track when we enter the proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node): void => {
          const ancestors = context.sourceCode.getAncestors(node);
          for (const ancestor of ancestors) {
            const ancestorType = (ancestor as { type: string }).type;
            if (ancestorType === 'VariableDeclarator') {
              const declarator = ancestor as unknown as NodeWithId;
              const id = declarator.id as NodeWithName | undefined;
              if (id?.name?.endsWith('Proxy')) {
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
      'Program:exit': (node): void => {
        // Check 1: For each implementation import, verify proxy has corresponding import and creation
        for (const [importedName, importPath] of implementationImports) {
          // Derive expected proxy name and path
          const expectedProxyName = deriveProxyName(importedName);
          const expectedProxyPath = deriveProxyPath(importPath);

          // Check if proxy imports the corresponding proxy
          const hasProxyImport = Array.from(proxyImports.keys()).some(
            (name) => name === expectedProxyName,
          );

          if (!hasProxyImport) {
            context.report({
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
            context.report({
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
              filename.split('/').pop()?.replace('.proxy.ts', '.ts') || 'implementation';

            context.report({
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

  // Simple regex to match import statements
  // Matches: import { name } from 'path' or import name from 'path'
  const importRegex = /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
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

    // Skip multi-dot files except .proxy (like .test.ts, .stub.ts already filtered above)
    const pathParts = importPath.split('/').pop() || '';
    const dotCount = (pathParts.match(/\./g) || []).length;
    if (dotCount > 0 && !importPath.endsWith('.proxy')) {
      continue;
    }

    // Everything else is an architectural component that needs a proxy
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

// Derive proxy function name from implementation name
// e.g., httpAdapter -> httpAdapterProxy
const deriveProxyName = (implementationName: string): string => `${implementationName}Proxy`;

// Derive proxy import path from implementation path
// e.g., ../../adapters/http/http-adapter -> ../../adapters/http/http-adapter.proxy
const deriveProxyPath = (implementationPath: string): string => {
  // If path already has extension, replace it
  if (implementationPath.endsWith('.ts')) {
    return implementationPath.replace('.ts', '.proxy');
  }

  // Otherwise append .proxy
  return `${implementationPath}.proxy`;
};
