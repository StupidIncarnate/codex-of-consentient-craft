/**
 * PURPOSE: Extracts jest.mock() and registerMock({ fn }) calls from TypeScript AST
 *
 * USAGE:
 * const mockCalls = typescriptAstToMockCallsAdapter({sourceFile});
 * // Returns array of MockCall objects with module names and factories
 */

import * as ts from 'typescript';
import { mockCallContract } from '../../../contracts/mock-call/mock-call-contract';
import { moduleNameContract } from '../../../contracts/module-name/module-name-contract';
import { identifierNameContract } from '../../../contracts/identifier-name/identifier-name-contract';
import { factoryFunctionTextContract } from '../../../contracts/factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../../../contracts/source-file-name/source-file-name-contract';
import type { IdentifierName } from '../../../contracts/identifier-name/identifier-name-contract';
import type { MockCall } from '../../../contracts/mock-call/mock-call-contract';
import type { ModuleName } from '../../../contracts/module-name/module-name-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptAstToMockCallsAdapter = ({
  sourceFile,
}: {
  sourceFile: TypescriptSourceFile;
}): MockCall[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const mockCalls: MockCall[] = [];

  // Only extract module-level jest.mock() calls (direct children of source file statements).
  // jest.mock() calls inside function bodies are intentionally scoped and must NOT be hoisted,
  // as hoisting them can cause side effects (e.g., jest.requireActual loading real modules
  // before other mocks are registered).
  for (const statement of tsSourceFile.statements) {
    const nodesToVisit: ts.Node[] = [];

    // For expression statements (e.g., `jest.mock('os');`), check the expression directly
    if (ts.isExpressionStatement(statement)) {
      nodesToVisit.push(statement.expression);
    }

    // Also check variable declarations at module level that might contain jest.mock
    // (e.g., `const x = jest.mock(...)`) - though this is rare
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (decl.initializer) {
          nodesToVisit.push(decl.initializer);
        }
      }
    }

    for (const node of nodesToVisit) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'jest' &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === 'mock'
      ) {
        const [firstArg, secondArg] = node.arguments;
        if (firstArg && ts.isStringLiteral(firstArg)) {
          const moduleName = moduleNameContract.parse(firstArg.text);

          let factoryText: ReturnType<typeof factoryFunctionTextContract.parse> | null = null;
          if (secondArg) {
            factoryText = factoryFunctionTextContract.parse(secondArg.getText(tsSourceFile));
          }

          mockCalls.push(
            mockCallContract.parse({
              moduleName,
              factory: factoryText,
              sourceFile: sourceFileNameContract.parse(tsSourceFile.fileName),
            }),
          );
        }
      }
    }
  }

  // Build import map: identifier name -> module specifier for registerMock resolution
  const importMap = new Map<IdentifierName, ModuleName>();

  for (const statement of tsSourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const { moduleSpecifier } = statement;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      continue;
    }

    const moduleName = moduleNameContract.parse(moduleSpecifier.text);
    const { importClause } = statement;
    if (!importClause || importClause.isTypeOnly) {
      continue;
    }

    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        if (!element.isTypeOnly) {
          importMap.set(identifierNameContract.parse(element.name.text), moduleName);
        }
      }
    }

    if (importClause.name) {
      importMap.set(identifierNameContract.parse(importClause.name.text), moduleName);
    }

    if (importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
      importMap.set(identifierNameContract.parse(importClause.namedBindings.name.text), moduleName);
    }
  }

  // Walk all nodes to find registerMock({ fn: IDENTIFIER }) calls at any depth
  const nodeStack: ts.Node[] = [...tsSourceFile.statements];

  while (nodeStack.length > 0) {
    const node = nodeStack.shift();
    if (!node) {
      continue;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'registerMock' &&
      node.arguments.length >= 1
    ) {
      const [firstArg] = node.arguments;
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        for (const prop of firstArg.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            ts.isIdentifier(prop.name) &&
            prop.name.text === 'fn'
          ) {
            // Resolve the leftmost identifier from the `fn` value
            // Handles both `fn: readFile` (Identifier) and `fn: StartOrchestrator.addGuild` (PropertyAccessExpression)
            if (ts.isIdentifier(prop.initializer)) {
              const rootIdentifier: IdentifierName = identifierNameContract.parse(
                prop.initializer.text,
              );
              const resolvedModule = importMap.get(rootIdentifier);
              if (resolvedModule) {
                mockCalls.push(
                  mockCallContract.parse({
                    moduleName: moduleNameContract.parse(resolvedModule),
                    factory: null,
                    sourceFile: sourceFileNameContract.parse(tsSourceFile.fileName),
                  }),
                );
              }
            } else if (ts.isPropertyAccessExpression(prop.initializer)) {
              let current: ts.Expression = prop.initializer;
              while (ts.isPropertyAccessExpression(current)) {
                current = current.expression;
              }
              if (ts.isIdentifier(current)) {
                const rootIdentifier: IdentifierName = identifierNameContract.parse(current.text);
                const resolvedModule = importMap.get(rootIdentifier);
                if (resolvedModule) {
                  mockCalls.push(
                    mockCallContract.parse({
                      moduleName: moduleNameContract.parse(resolvedModule),
                      factory: null,
                      sourceFile: sourceFileNameContract.parse(tsSourceFile.fileName),
                    }),
                  );
                }
              }
            }
          }

          if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === 'fn') {
            const resolvedModule = importMap.get(identifierNameContract.parse(prop.name.text));
            if (resolvedModule) {
              mockCalls.push(
                mockCallContract.parse({
                  moduleName: moduleNameContract.parse(resolvedModule),
                  factory: null,
                  sourceFile: sourceFileNameContract.parse(tsSourceFile.fileName),
                }),
              );
            }
          }
        }
      }
    }

    ts.forEachChild(node, (child) => {
      nodeStack.push(child);
    });
  }

  return mockCalls;
};
