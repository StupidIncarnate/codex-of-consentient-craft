/**
 * PURPOSE: Converts MockCall objects to TypeScript AST statement nodes
 *
 * USAGE:
 * const statements = typescriptMockCallsToStatementsAdapter({mockCalls, nodeFactory});
 * // Returns array of TypeScript statement nodes for jest.mock() calls
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
        args.push(firstStatement.expression);
      }
    }

    const callExpression = tsNodeFactory.createCallExpression(jestMock, undefined, args);

    const statement = tsNodeFactory.createExpressionStatement(callExpression);

    return ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` ✅ Auto-hoisted from: ${mock.sourceFile}`,
      true,
    ) as unknown as TypescriptStatement;
  });
};
