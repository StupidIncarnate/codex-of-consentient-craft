/**
 * PURPOSE: Extracts jest.mock() calls from TypeScript AST
 *
 * USAGE:
 * const mockCalls = typescriptAstToMockCallsAdapter({sourceFile});
 * // Returns array of MockCall objects with module names and factories
 */

import * as ts from 'typescript';
import { mockCallContract } from '../../../contracts/mock-call/mock-call-contract';
import { moduleNameContract } from '../../../contracts/module-name/module-name-contract';
import { factoryFunctionTextContract } from '../../../contracts/factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../../../contracts/source-file-name/source-file-name-contract';
import type { MockCall } from '../../../contracts/mock-call/mock-call-contract';
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

  return mockCalls;
};
