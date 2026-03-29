/**
 * PURPOSE: Extracts registerModuleMock({ module: '...', factory?: ... }) calls from TypeScript AST
 *
 * USAGE:
 * const mockCalls = typescriptAstToModuleMockCallsAdapter({ sourceFile });
 * // Returns array of MockCall objects for registerModuleMock() calls
 */

import * as ts from 'typescript';
import { mockCallContract } from '../../../contracts/mock-call/mock-call-contract';
import { moduleNameContract } from '../../../contracts/module-name/module-name-contract';
import { factoryFunctionTextContract } from '../../../contracts/factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../../../contracts/source-file-name/source-file-name-contract';
import type { MockCall } from '../../../contracts/mock-call/mock-call-contract';
import type { ModuleName } from '../../../contracts/module-name/module-name-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptAstToModuleMockCallsAdapter = ({
  sourceFile,
}: {
  sourceFile: TypescriptSourceFile;
}): MockCall[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const mockCalls: MockCall[] = [];

  const nodeStack: ts.Node[] = [...tsSourceFile.statements];

  while (nodeStack.length > 0) {
    const node = nodeStack.shift();
    if (!node) {
      continue;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'registerModuleMock' &&
      node.arguments.length >= 1
    ) {
      const [firstArg] = node.arguments;
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        let moduleProp: ModuleName | null = null;
        let factoryProp: ReturnType<typeof factoryFunctionTextContract.parse> | null = null;

        for (const prop of firstArg.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            if (prop.name.text === 'module' && ts.isStringLiteral(prop.initializer)) {
              moduleProp = moduleNameContract.parse(prop.initializer.text);
            }
            if (prop.name.text === 'factory') {
              factoryProp = factoryFunctionTextContract.parse(
                prop.initializer.getText(tsSourceFile),
              );
            }
          }
        }

        if (moduleProp) {
          mockCalls.push(
            mockCallContract.parse({
              moduleName: moduleProp,
              factory: factoryProp,
              sourceFile: sourceFileNameContract.parse(tsSourceFile.fileName),
            }),
          );
        }
      }
    }

    ts.forEachChild(node, (child) => {
      nodeStack.push(child);
    });
  }

  return mockCalls;
};
