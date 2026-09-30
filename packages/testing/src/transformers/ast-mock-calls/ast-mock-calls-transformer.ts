/**
 * PURPOSE: Extracts jest.mock() and registerMock({ fn }) calls from TypeScript AST
 *
 * USAGE:
 * const mockCalls = astMockCallsTransformer({sourceFile});
 * // Returns array of MockCall objects with module names and factories
 */

import * as ts from '#gateway/npm/typescript';
import { mockCallContract } from '../../contracts/mock-call/mock-call-contract';
import { factoryFunctionTextContract } from '../../contracts/factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../../contracts/source-file-name/source-file-name-contract';
import { mockFnIdentifierNamesTransformer } from '../mock-fn-identifier-names/mock-fn-identifier-names-transformer';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';

export const astMockCallsTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): MockCall[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const mockCalls: MockCall[] = [];

  // Only extract module-level jest.mock() calls (direct children of source file statements).
  // jest.mock() calls inside function bodies are intentionally scoped and must NOT be hoisted,
  // as hoisting them can cause side effects (e.g., jest.requireActual loading real modules
  // before other mocks are registered).
  for (const statement of tsSourceFile.statements) {
    const nodesToVisit: ts.Node[] = [];

    if (ts.isExpressionStatement(statement)) {
      nodesToVisit.push(statement.expression);
    }

    if (ts.isVariableStatement(statement)) {
      const initializers = statement.declarationList.declarations
        .map((decl) => decl.initializer)
        .filter((init): init is ts.Expression => init !== undefined);
      nodesToVisit.push(...initializers);
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
          const moduleName = firstArg.text;
          const factoryText = secondArg
            ? factoryFunctionTextContract.parse(secondArg.getText(tsSourceFile))
            : null;

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

  // Build two maps for registerMock resolution:
  // importModuleMap: identifier -> module name (for all import types)
  // namedExportMap: identifier -> original export name (for named imports only, enables selective mocking)
  const importModuleMap = new Map<string, string>();
  const namedExportMap = new Map<string, string>();

  for (const statement of tsSourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const { moduleSpecifier } = statement;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      continue;
    }

    const moduleName = moduleSpecifier.text;
    const { importClause } = statement;
    if (!importClause || importClause.isTypeOnly) {
      continue;
    }

    if (importClause.name) {
      importModuleMap.set(importClause.name.text, moduleName);
    }

    const { namedBindings } = importClause;
    if (!namedBindings) {
      continue;
    }

    if (ts.isNamespaceImport(namedBindings)) {
      importModuleMap.set(namedBindings.name.text, moduleName);
      continue;
    }

    for (const element of namedBindings.elements) {
      if (!element.isTypeOnly) {
        const localName = element.name.text;
        const exportName = (element.propertyName ? element.propertyName.text : element.name.text);
        importModuleMap.set(localName, moduleName);
        namedExportMap.set(localName, exportName);
      }
    }
  }

  // Walk all nodes to find registerMock({ fn: IDENTIFIER }) calls at any depth
  const nodeStack: ts.Node[] = [...tsSourceFile.statements];
  const parsedSourceFile = sourceFileNameContract.parse(tsSourceFile.fileName);

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
            // Resolve root identifier. For property access (Obj.method), walk to the leftmost identifier.
            let rootIdentifier: string | null = null;
            let isPropertyAccess = false;

            if (ts.isIdentifier(prop.initializer)) {
              rootIdentifier = prop.initializer.text;
            } else if (ts.isPropertyAccessExpression(prop.initializer)) {
              isPropertyAccess = true;
              let current: ts.Expression = prop.initializer;
              while (ts.isPropertyAccessExpression(current)) {
                current = current.expression;
              }
              if (ts.isIdentifier(current)) {
                rootIdentifier = current.text;
              }
            }

            if (rootIdentifier) {
              const resolvedModule = importModuleMap.get(rootIdentifier);
              const exportName = namedExportMap.get(rootIdentifier);
              if (resolvedModule) {
                const { identifierNames, objectIdentifierNames } = mockFnIdentifierNamesTransformer(
                  { exportName, isPropertyAccess, rootIdentifier },
                );
                mockCalls.push(
                  mockCallContract.parse({
                    moduleName: resolvedModule,
                    factory: null,
                    sourceFile: parsedSourceFile,
                    identifierNames,
                    objectIdentifierNames,
                  }),
                );
              }
            }
          }

          if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === 'fn') {
            const shorthandIdentifier = prop.name.text;
            const resolvedModule = importModuleMap.get(shorthandIdentifier);
            const exportName = namedExportMap.get(shorthandIdentifier);
            if (resolvedModule) {
              const { identifierNames, objectIdentifierNames } = mockFnIdentifierNamesTransformer({
                exportName,
                isPropertyAccess: false,
                rootIdentifier: shorthandIdentifier,
              });
              mockCalls.push(
                mockCallContract.parse({
                  moduleName: resolvedModule,
                  factory: null,
                  sourceFile: parsedSourceFile,
                  identifierNames,
                  objectIdentifierNames,
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
