/**
 * PURPOSE: TypeScript AST transformer for Jest that hoists jest.mock() calls from .proxy.ts files to test files
 *
 * USAGE:
 * // In jest.config.js
 * module.exports = {
 *   globals: {
 *     'ts-jest': {
 *       astTransformers: {
 *         before: ['@questmaestro/testing/dist/adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter.js']
 *       }
 *     }
 *   }
 * };
 * // Automatically hoists jest.mock() calls from proxy files to the top of test files during compilation
 *
 * WHEN-TO-USE: When using proxy pattern with jest.mock() calls that need to be hoisted for Jest to recognize them
 * WHEN-NOT-TO-USE: This is infrastructure code - required by ts-jest, do not modify unless changing transformer behavior
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface TransformerOptions {
  // Directory to resolve imports from (usually the project root)
  baseDir?: string;
}

interface MockCall {
  moduleName: string;
  factory: string | null; // The factory function if provided, null otherwise
  sourceFile: string;
}

// Export name and version for ts-jest
export const name = 'jest-proxy-mock-transformer';
export const version = 1;

/**
 * Find all imports to .proxy.ts files in the source file
 */
const findProxyImports = ({ sourceFile }: { sourceFile: ts.SourceFile }): string[] => {
  const proxyImports: string[] = [];

  const visit = ({ node }: { node: ts.Node }): void => {
    // Check for import declarations: import { ... } from './foo.proxy'
    if (ts.isImportDeclaration(node)) {
      const { moduleSpecifier } = node;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        if (importPath.includes('.proxy')) {
          proxyImports.push(importPath);
        }
      }
    }

    ts.forEachChild(node, (child) => {
      visit({ node: child });
    });
  };

  visit({ node: sourceFile });
  return proxyImports;
};

/**
 * Resolve an import path to an absolute file path
 */
const resolveImportPath = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: string;
  importPath: string;
}): string | null => {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const sourceDir = path.dirname(sourceFilePath);
    const resolved = path.resolve(sourceDir, importPath);

    // Try with .ts extension
    if (fs.existsSync(`${resolved}.ts`)) {
      return `${resolved}.ts`;
    }

    // Try without extension (already has .ts)
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
};

/**
 * Find all jest.mock() calls in a source file
 */
const findJestMockCalls = ({ sourceFile }: { sourceFile: ts.SourceFile }): MockCall[] => {
  const mockCalls: MockCall[] = [];

  const visit = ({ node }: { node: ts.Node }): void => {
    // Look for: jest.mock('module-name')
    // or: jest.mock('module-name', () => ({ ... }))
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'jest' &&
      ts.isIdentifier(node.expression.name) &&
      node.expression.name.text === 'mock'
    ) {
      // First argument is the module name
      const [firstArg, secondArg] = node.arguments;
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const moduleName = firstArg.text;

        // Second argument is optional factory function
        let factoryText: string | null = null;
        if (secondArg) {
          // Get the text of the factory function
          factoryText = secondArg.getText(sourceFile);
        }

        mockCalls.push({
          moduleName,
          factory: factoryText,
          sourceFile: sourceFile.fileName,
        });
      }
    }

    ts.forEachChild(node, (child) => {
      visit({ node: child });
    });
  };

  visit({ node: sourceFile });
  return mockCalls;
};

/**
 * Recursively collect jest.mock() calls from a proxy file and its dependencies
 */
const collectMocksFromProxyChain = ({
  proxyFilePath,
  visitedFiles,
  mockCalls,
  program,
}: {
  proxyFilePath: string;
  visitedFiles: Set<string>;
  mockCalls: MockCall[];
  program: ts.Program;
}): void => {
  // Avoid circular dependencies
  if (visitedFiles.has(proxyFilePath)) {
    return;
  }
  visitedFiles.add(proxyFilePath);

  // Parse the proxy file
  const sourceFile = program.getSourceFile(proxyFilePath);
  if (!sourceFile) {
    return;
  }

  // Find jest.mock() calls in this file
  const mocks = findJestMockCalls({ sourceFile });
  mockCalls.push(...mocks);

  // Find any other .proxy.ts imports and follow the chain
  const proxyImports = findProxyImports({ sourceFile });
  for (const proxyImport of proxyImports) {
    const nextProxyPath = resolveImportPath({
      sourceFilePath: proxyFilePath,
      importPath: proxyImport,
    });
    if (nextProxyPath) {
      collectMocksFromProxyChain({
        proxyFilePath: nextProxyPath,
        visitedFiles,
        mockCalls,
        program,
      });
    }
  }
};

/**
 * Hoist mock calls to the top of the test file
 */
const hoistMocksToTop = ({
  sourceFile,
  mockCalls,
  nodeFactory,
}: {
  sourceFile: ts.SourceFile;
  mockCalls: MockCall[];
  nodeFactory: ts.NodeFactory;
}): ts.SourceFile => {
  // Create jest.mock() call expression statements
  const mockStatements = mockCalls.map((mock) => {
    // Create: jest.mock('module-name')
    // or: jest.mock('module-name', () => ({ ... }))
    const jestIdentifier = nodeFactory.createIdentifier('jest');
    const mockIdentifier = nodeFactory.createIdentifier('mock');
    const jestMock = nodeFactory.createPropertyAccessExpression(jestIdentifier, mockIdentifier);

    const args: ts.Expression[] = [nodeFactory.createStringLiteral(mock.moduleName)];

    // If there's a factory function, we need to parse and add it
    if (mock.factory) {
      // For now, we'll create a raw text node
      // This is a limitation - we're not fully parsing the factory
      // But it should work for most cases
      const factoryText = mock.factory;
      // Create a simple arrow function or function expression
      // We'll use a hack here: create it from text
      const tempSourceFile = ts.createSourceFile(
        'temp.ts',
        factoryText,
        ts.ScriptTarget.Latest,
        true,
      );
      const [firstStatement] = tempSourceFile.statements;
      if (firstStatement && ts.isExpressionStatement(firstStatement)) {
        args.push(firstStatement.expression);
      }
    }

    const callExpression = nodeFactory.createCallExpression(
      jestMock,
      undefined, // type arguments
      args,
    );

    const statement = nodeFactory.createExpressionStatement(callExpression);

    // Use ts.addSyntheticLeadingComment to add the comment
    return ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` ✅ Auto-hoisted from: ${path.basename(mock.sourceFile)}`,
      true, // hasTrailingNewLine
    );
  });

  // Insert mock statements at the top of the file (after any leading comments)
  const statements = nodeFactory.createNodeArray([...mockStatements, ...sourceFile.statements]);

  return nodeFactory.updateSourceFile(sourceFile, statements);
};

/**
 * Main transformer factory function
 */
export const typescriptProxyMockTransformerAdapter =
  ({
    program,
    options: _options,
  }: {
    program: ts.Program;
    options?: TransformerOptions;
  }): ts.TransformerFactory<ts.SourceFile> =>
  ({ factory: nodeFactory }: ts.TransformationContext) =>
  (sourceFile: ts.SourceFile) => {
    // Only process .test.ts files
    if (!sourceFile.fileName.includes('.test.ts')) {
      return sourceFile;
    }

    const visitedFiles = new Set<string>();
    const mockCalls: MockCall[] = [];

    // Find all proxy imports in this test file
    const proxyImports = findProxyImports({ sourceFile });

    // For each proxy import, walk the chain and collect jest.mock() calls
    for (const proxyImport of proxyImports) {
      const proxyPath = resolveImportPath({
        sourceFilePath: sourceFile.fileName,
        importPath: proxyImport,
      });
      if (proxyPath) {
        collectMocksFromProxyChain({
          proxyFilePath: proxyPath,
          visitedFiles,
          mockCalls,
          program,
        });
      }
    }

    // If we found any mocks, hoist them to the top of the test file
    if (mockCalls.length > 0) {
      return hoistMocksToTop({
        sourceFile,
        mockCalls,
        nodeFactory,
      });
    }

    return sourceFile;
  };

/**
 * Factory function that ts-jest calls
 */
export const factory = ({
  program,
}: {
  program?: ts.Program;
}): ts.TransformerFactory<ts.SourceFile> => {
  if (!program) {
    throw new Error('jest-proxy-mock-transformer requires a TypeScript Program');
  }
  return typescriptProxyMockTransformerAdapter({ program });
};
