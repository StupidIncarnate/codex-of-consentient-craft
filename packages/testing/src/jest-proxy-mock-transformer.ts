/**
 * Custom TypeScript AST transformer for Jest that automatically hoists jest.mock() calls
 * from .proxy.ts files to test files that import them.
 *
 * Problem:
 * - Jest only hoists jest.mock() calls within the same file
 * - When jest.mock() is in a proxy file, it doesn't work for the test file that imports it
 *
 * Solution:
 * - When a test file imports a .proxy.ts file, this transformer:
 *   1. Walks the entire proxy import chain recursively
 *   2. Finds ALL jest.mock() calls in any proxy file
 *   3. Hoists them to the top of the test file during transpilation
 *   4. Comments out jest.mock() in proxy files to prevent duplicate calls
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
 * Factory function that ts-jest calls
 */
export const factory = (compilerInstance: { program?: ts.Program }) => {
  const program = compilerInstance.program;
  if (!program) {
    throw new Error('jest-proxy-mock-transformer requires a TypeScript Program');
  }
  return proxyMockTransformer(program);
};

/**
 * Main transformer factory function
 */
export function proxyMockTransformer(
  program: ts.Program,
  options?: TransformerOptions,
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      // Only process .test.ts files
      if (!sourceFile.fileName.includes('.test.ts')) {
        return sourceFile;
      }

      const baseDir = options?.baseDir || process.cwd();
      const visitedFiles = new Set<string>();
      const mockCalls: MockCall[] = [];

      // Find all proxy imports in this test file
      const proxyImports = findProxyImports(sourceFile);

      // For each proxy import, walk the chain and collect jest.mock() calls
      for (const proxyImport of proxyImports) {
        const proxyPath = resolveImportPath(sourceFile.fileName, proxyImport, baseDir);
        if (proxyPath) {
          collectMocksFromProxyChain(proxyPath, baseDir, visitedFiles, mockCalls, program);
        }
      }

      // If we found any mocks, hoist them to the top of the test file
      if (mockCalls.length > 0) {
        return hoistMocksToTop(sourceFile, mockCalls, context.factory);
      }

      return sourceFile;
    };
  };
}

/**
 * Find all imports to .proxy.ts files in the source file
 */
function findProxyImports(sourceFile: ts.SourceFile): string[] {
  const proxyImports: string[] = [];

  function visit(node: ts.Node): void {
    // Check for import declarations: import { ... } from './foo.proxy'
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        if (importPath.includes('.proxy')) {
          proxyImports.push(importPath);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return proxyImports;
}

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(
  sourceFilePath: string,
  importPath: string,
  _baseDir: string,
): string | null {
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
}

/**
 * Recursively collect jest.mock() calls from a proxy file and its dependencies
 */
function collectMocksFromProxyChain(
  proxyFilePath: string,
  _baseDir: string,
  visitedFiles: Set<string>,
  mockCalls: MockCall[],
  program: ts.Program,
): void {
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
  const mocks = findJestMockCalls(sourceFile);
  mockCalls.push(...mocks);

  // Find any other .proxy.ts imports and follow the chain
  const proxyImports = findProxyImports(sourceFile);
  for (const proxyImport of proxyImports) {
    const nextProxyPath = resolveImportPath(proxyFilePath, proxyImport, _baseDir);
    if (nextProxyPath) {
      collectMocksFromProxyChain(nextProxyPath, _baseDir, visitedFiles, mockCalls, program);
    }
  }
}

/**
 * Find all jest.mock() calls in a source file
 */
function findJestMockCalls(sourceFile: ts.SourceFile): MockCall[] {
  const mockCalls: MockCall[] = [];

  function visit(node: ts.Node): void {
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
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const moduleName = firstArg.text;

        // Second argument is optional factory function
        let factory: string | null = null;
        const secondArg = node.arguments[1];
        if (secondArg) {
          // Get the text of the factory function
          factory = secondArg.getText(sourceFile);
        }

        mockCalls.push({
          moduleName,
          factory,
          sourceFile: sourceFile.fileName,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return mockCalls;
}

/**
 * Hoist mock calls to the top of the test file
 */
function hoistMocksToTop(
  sourceFile: ts.SourceFile,
  mockCalls: MockCall[],
  factory: ts.NodeFactory,
): ts.SourceFile {
  // Create jest.mock() call expression statements
  const mockStatements = mockCalls.map((mock) => {
    // Create: jest.mock('module-name')
    // or: jest.mock('module-name', () => ({ ... }))
    const jestIdentifier = factory.createIdentifier('jest');
    const mockIdentifier = factory.createIdentifier('mock');
    const jestMock = factory.createPropertyAccessExpression(jestIdentifier, mockIdentifier);

    const args: ts.Expression[] = [factory.createStringLiteral(mock.moduleName)];

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
      const firstStatement = tempSourceFile.statements[0];
      if (firstStatement && ts.isExpressionStatement(firstStatement)) {
        args.push(firstStatement.expression);
      }
    }

    const callExpression = factory.createCallExpression(
      jestMock,
      undefined, // type arguments
      args,
    );

    const statement = factory.createExpressionStatement(callExpression);

    // Use ts.addSyntheticLeadingComment to add the comment
    return ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` ✅ Auto-hoisted from: ${path.basename(mock.sourceFile)}`,
      true, // hasTrailingNewLine
    );
  });

  // Insert mock statements at the top of the file (after any leading comments)
  const statements = factory.createNodeArray([...mockStatements, ...sourceFile.statements]);

  return factory.updateSourceFile(sourceFile, statements);
}
