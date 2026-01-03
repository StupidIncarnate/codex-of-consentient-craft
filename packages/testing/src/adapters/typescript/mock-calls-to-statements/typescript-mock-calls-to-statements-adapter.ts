/**
 * PURPOSE: Converts MockCall objects to TypeScript AST statement nodes
 *
 * USAGE:
 * const statements = typescriptMockCallsToStatementsAdapter({mockCalls, nodeFactory});
 * // Returns array of TypeScript statement nodes for jest.mock() calls
 *
 * Factory expressions are cloned with synthetic positions to prevent the TypeScript
 * printer from extracting text at wrong positions when nodes from one source file
 * are inserted into another source file.
 */

import * as ts from 'typescript';
import type { MockCall } from '../../../contracts/mock-call/mock-call-contract';
import type { TypescriptNodeFactory } from '../../../contracts/typescript-node-factory/typescript-node-factory-contract';
import type { TypescriptStatement } from '../../../contracts/typescript-statement/typescript-statement-contract';

export const typescriptMockCallsToStatementsAdapter = ({
  mockCalls,
  nodeFactory,
}: {
  mockCalls: MockCall[];
  nodeFactory: TypescriptNodeFactory;
}): TypescriptStatement[] => {
  const tsNodeFactory = nodeFactory as unknown as ts.NodeFactory;
  const { factory } = ts;

  return mockCalls.map((mock) => {
    const jestIdentifier = tsNodeFactory.createIdentifier('jest');
    const mockIdentifier = tsNodeFactory.createIdentifier('mock');
    const jestMock = tsNodeFactory.createPropertyAccessExpression(jestIdentifier, mockIdentifier);

    const args: ts.Expression[] = [tsNodeFactory.createStringLiteral(mock.moduleName)];

    if (mock.factory) {
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

    const callExpression = tsNodeFactory.createCallExpression(jestMock, undefined, args);

    const statement = tsNodeFactory.createExpressionStatement(callExpression);

    return ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` Auto-hoisted from: ${mock.sourceFile}`,
      true,
    ) as unknown as TypescriptStatement;
  });
};
