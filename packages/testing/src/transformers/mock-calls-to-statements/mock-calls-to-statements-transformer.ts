/**
 * PURPOSE: Converts merged MockCall objects into the jest.mock() statements the proxy-mock hoister
 * prepends to a test file. ts-jest/proxy-mock-transformer.js hashes this file by path into its cache
 * key, so a move here moves that path too.
 *
 * USAGE:
 * const statements = mockCallsToStatementsTransformer({mockCalls, nodeFactory});
 * // Returns array of TypeScript statement nodes for jest.mock() calls
 *
 * Factory expressions are cloned with synthetic positions to prevent the TypeScript
 * printer from extracting text at wrong positions when nodes from one source file
 * are inserted into another source file.
 */

import * as ts from '#gateway/npm/typescript';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';

export const mockCallsToStatementsTransformer = ({
  mockCalls,
  nodeFactory,
}: {
  mockCalls: MockCall[];
  nodeFactory: ts.NodeFactory;
}): ts.Statement[] => {
  const { factory } = ts;

  return mockCalls.map((mock) => {
    const jestIdentifier = nodeFactory.createIdentifier('jest');
    const mockIdentifier = nodeFactory.createIdentifier('mock');
    const jestMock = nodeFactory.createPropertyAccessExpression(jestIdentifier, mockIdentifier);

    const args: ts.Expression[] = [nodeFactory.createStringLiteral(mock.moduleName)];

    if (
      !mock.factory &&
      (mock.identifierNames.length > 0 || mock.objectIdentifierNames.length > 0)
    ) {
      // Generate selective factory: () => ({ ...jest.requireActual('module'), id1: jest.fn(), id2: jest.fn() })
      const requireActualCall = nodeFactory.createCallExpression(
        nodeFactory.createPropertyAccessExpression(
          nodeFactory.createIdentifier('jest'),
          nodeFactory.createIdentifier('requireActual'),
        ),
        undefined,
        [nodeFactory.createStringLiteral(mock.moduleName)],
      );
      const mockProperties: ts.ObjectLiteralElementLike[] = [];
      for (const identifierName of mock.identifierNames) {
        const jestFnCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('jest'),
            nodeFactory.createIdentifier('fn'),
          ),
          undefined,
          [],
        );
        mockProperties.push(
          nodeFactory.createPropertyAssignment(
            nodeFactory.createIdentifier(identifierName),
            jestFnCall,
          ),
        );
      }

      // A property-access request (`registerMock({fn: X.method})`) records X here. Rather than
      // replacing X with a flat jest.fn() (destroying every OTHER method X carries), each of X's
      // OWN methods is individually auto-mocked — the same recursive treatment Jest's bare
      // `jest.mock(module)` already gives a nested object, given one named object at a time
      // instead of the whole module: `X: Object.fromEntries(Object.entries(<real>.X).map(([key,
      // value]) => [key, typeof value === 'function' ? jest.fn() : value]))`.
      for (const objectIdentifierName of mock.objectIdentifierNames) {
        const objectRequireActualCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('jest'),
            nodeFactory.createIdentifier('requireActual'),
          ),
          undefined,
          [nodeFactory.createStringLiteral(mock.moduleName)],
        );
        const realObjectAccess = nodeFactory.createPropertyAccessExpression(
          nodeFactory.createParenthesizedExpression(objectRequireActualCall),
          nodeFactory.createIdentifier(objectIdentifierName),
        );
        const keyIdentifier = nodeFactory.createIdentifier('key');
        const valueIdentifier = nodeFactory.createIdentifier('value');
        const arrayParam = nodeFactory.createParameterDeclaration(
          undefined,
          undefined,
          nodeFactory.createArrayBindingPattern([
            nodeFactory.createBindingElement(undefined, undefined, keyIdentifier, undefined),
            nodeFactory.createBindingElement(undefined, undefined, valueIdentifier, undefined),
          ]),
          undefined,
          undefined,
          undefined,
        );
        const isFunctionCheck = nodeFactory.createBinaryExpression(
          nodeFactory.createTypeOfExpression(valueIdentifier),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          nodeFactory.createStringLiteral('function'),
        );
        const nestedJestFnCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('jest'),
            nodeFactory.createIdentifier('fn'),
          ),
          undefined,
          [],
        );
        const mapArrow = nodeFactory.createArrowFunction(
          undefined,
          undefined,
          [arrayParam],
          undefined,
          undefined,
          nodeFactory.createArrayLiteralExpression(
            [
              keyIdentifier,
              nodeFactory.createConditionalExpression(
                isFunctionCheck,
                nodeFactory.createToken(ts.SyntaxKind.QuestionToken),
                nestedJestFnCall,
                nodeFactory.createToken(ts.SyntaxKind.ColonToken),
                valueIdentifier,
              ),
            ],
            false,
          ),
        );
        const objectEntriesCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('Object'),
            nodeFactory.createIdentifier('entries'),
          ),
          undefined,
          [realObjectAccess],
        );
        const mapCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            objectEntriesCall,
            nodeFactory.createIdentifier('map'),
          ),
          undefined,
          [mapArrow],
        );
        const fromEntriesCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('Object'),
            nodeFactory.createIdentifier('fromEntries'),
          ),
          undefined,
          [mapCall],
        );
        mockProperties.push(
          nodeFactory.createPropertyAssignment(
            nodeFactory.createIdentifier(objectIdentifierName),
            fromEntriesCall,
          ),
        );
      }

      if (mock.moduleName === 'process' || mock.moduleName === 'node:process') {
        const objectCreateCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('Object'),
            nodeFactory.createIdentifier('create'),
          ),
          undefined,
          [requireActualCall],
        );
        const objectLiteral = nodeFactory.createObjectLiteralExpression(mockProperties, false);
        const objectAssignCall = nodeFactory.createCallExpression(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('Object'),
            nodeFactory.createIdentifier('assign'),
          ),
          undefined,
          [objectCreateCall, objectLiteral],
        );
        const factoryArrow = nodeFactory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          objectAssignCall,
        );
        args.push(factoryArrow);
      } else {
        // Spread `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)`, never the bare requireActual:
        // for a module the unit-test I/O trap covers (jest.setup-io-trap.js), a real spread would
        // leave every function the proxies did not name doing real I/O. `__ioTrap` returns
        // undefined for any other module, and is absent in integration tests.
        const ioTrapCall = nodeFactory.createCallChain(
          nodeFactory.createPropertyAccessExpression(
            nodeFactory.createIdentifier('globalThis'),
            nodeFactory.createIdentifier('__ioTrap'),
          ),
          nodeFactory.createToken(ts.SyntaxKind.QuestionDotToken),
          undefined,
          [nodeFactory.createStringLiteral(mock.moduleName)],
        );
        const trappedOrActual = nodeFactory.createParenthesizedExpression(
          nodeFactory.createBinaryExpression(
            ioTrapCall,
            ts.SyntaxKind.QuestionQuestionToken,
            requireActualCall,
          ),
        );
        const spreadActual = nodeFactory.createSpreadAssignment(trappedOrActual);
        const objectLiteral = nodeFactory.createObjectLiteralExpression(
          [spreadActual, ...mockProperties],
          false,
        );
        const factoryArrow = nodeFactory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          nodeFactory.createParenthesizedExpression(objectLiteral),
        );
        args.push(factoryArrow);
      }
    } else if (mock.factory) {
      const tempSourceFile = ts.createSourceFile(
        'temp.ts',
        mock.factory,
        ts.ScriptTarget.Latest,
        true,
      );
      const [firstStatement] = tempSourceFile.statements;
      if (firstStatement && ts.isExpressionStatement(firstStatement)) {
        const factoryExpr = firstStatement.expression;

        // Clone the factory expression with synthetic positions using stack-based iteration.
        // This ensures the TypeScript printer uses node values instead of extracting from
        // wrong source file text positions.
        const cloneMap = new Map<ts.Node, ts.Node>();
        type WorkItem = { type: 'visit'; node: ts.Node } | { type: 'assemble'; node: ts.Node };
        const workStack: WorkItem[] = [{ type: 'visit', node: factoryExpr }];

        for (
          let iteration = 0;
          workStack.length > 0 && iteration < Number.MAX_SAFE_INTEGER;
          iteration += 1
        ) {
          const item = workStack.pop();
          if (item === undefined) {
            break;
          }

          if (item.type === 'visit') {
            const children: ts.Node[] = [];
            ts.forEachChild(item.node, (child: ts.Node) => {
              children.push(child);
            });
            workStack.push({ type: 'assemble', node: item.node });
            for (const child of children) {
              workStack.push({ type: 'visit', node: child });
            }
          } else {
            const originalNode = item.node;
            let clonedNode: ts.Node = originalNode;

            if (ts.isStringLiteral(originalNode)) {
              clonedNode = factory.createStringLiteral(originalNode.text);
            } else if (ts.isNumericLiteral(originalNode)) {
              clonedNode = factory.createNumericLiteral(originalNode.text);
            } else if (ts.isIdentifier(originalNode)) {
              clonedNode = factory.createIdentifier(originalNode.text);
            } else if (ts.isPropertyAccessExpression(originalNode)) {
              const expr = cloneMap.get(originalNode.expression) as ts.Expression;
              const name = cloneMap.get(originalNode.name) as ts.MemberName;
              clonedNode = factory.createPropertyAccessExpression(expr, name);
            } else if (ts.isCallExpression(originalNode)) {
              const expr = cloneMap.get(originalNode.expression) as ts.Expression;
              const callArgs = originalNode.arguments.map((a) => cloneMap.get(a) as ts.Expression);
              clonedNode = factory.createCallExpression(expr, undefined, callArgs);
            } else if (ts.isArrowFunction(originalNode)) {
              const params = originalNode.parameters.map(
                (p) => cloneMap.get(p) as ts.ParameterDeclaration,
              );
              const body = cloneMap.get(originalNode.body) as ts.ConciseBody;
              clonedNode = factory.createArrowFunction(
                undefined,
                undefined,
                params,
                undefined,
                undefined,
                body,
              );
            } else if (ts.isParameter(originalNode)) {
              const name = cloneMap.get(originalNode.name) as ts.BindingName;
              const init = originalNode.initializer
                ? (cloneMap.get(originalNode.initializer) as ts.Expression)
                : undefined;
              clonedNode = factory.createParameterDeclaration(
                undefined,
                undefined,
                name,
                undefined,
                undefined,
                init,
              );
            } else if (ts.isParenthesizedExpression(originalNode)) {
              const expr = cloneMap.get(originalNode.expression) as ts.Expression;
              clonedNode = factory.createParenthesizedExpression(expr);
            } else if (ts.isObjectLiteralExpression(originalNode)) {
              const props = originalNode.properties.map(
                (p) => cloneMap.get(p) as ts.ObjectLiteralElementLike,
              );
              clonedNode = factory.createObjectLiteralExpression(props, false);
            } else if (ts.isSpreadAssignment(originalNode)) {
              const expr = cloneMap.get(originalNode.expression) as ts.Expression;
              clonedNode = factory.createSpreadAssignment(expr);
            } else if (ts.isPropertyAssignment(originalNode)) {
              const name = cloneMap.get(originalNode.name) as ts.PropertyName;
              const init = cloneMap.get(originalNode.initializer) as ts.Expression;
              clonedNode = factory.createPropertyAssignment(name, init);
            } else if (ts.isShorthandPropertyAssignment(originalNode)) {
              const name = cloneMap.get(originalNode.name) as ts.Identifier;
              clonedNode = factory.createShorthandPropertyAssignment(name);
            }

            cloneMap.set(originalNode, clonedNode);
          }
        }

        const syntheticExpr = (cloneMap.get(factoryExpr) ?? factoryExpr) as ts.Expression;
        args.push(syntheticExpr);
      }
    }

    const callExpression = nodeFactory.createCallExpression(jestMock, undefined, args);

    const statement = nodeFactory.createExpressionStatement(callExpression);

    return ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` Auto-hoisted from: ${mock.sourceFile}`,
      true,
    );
  });
};
