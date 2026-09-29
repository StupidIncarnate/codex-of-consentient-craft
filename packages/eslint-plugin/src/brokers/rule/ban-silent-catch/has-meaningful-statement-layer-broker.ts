/**
 * PURPOSE: Checks if an array of AST statements contains any meaningful operation (call, throw, assignment, etc.)
 *
 * USAGE:
 * const meaningful = hasMeaningfulStatementLayerBroker({ statements });
 * // Returns true if any statement is a function call, throw, assignment, or non-undefined return
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const hasMeaningfulStatementLayerBroker = ({
  statements,
}: {
  statements: TSESTree.Node[];
}): boolean => {
  for (const statement of statements) {
    // ThrowStatement is always meaningful
    if (statement.type === AST_NODE_TYPES.ThrowStatement) {
      return true;
    }

    // ReturnStatement with a non-undefined argument is meaningful
    if (statement.type === AST_NODE_TYPES.ReturnStatement) {
      const { argument } = statement;

      // return; or return undefined; — not meaningful
      if (!argument) {
        continue;
      }

      if (argument.type === AST_NODE_TYPES.Identifier && argument.name === 'undefined') {
        continue;
      }

      // return <something else> — meaningful
      return true;
    }

    // ExpressionStatement wrapping a CallExpression or AssignmentExpression
    if (statement.type === AST_NODE_TYPES.ExpressionStatement) {
      const { expression } = statement;

      if (expression.type === AST_NODE_TYPES.CallExpression) {
        return true;
      }

      if (expression.type === AST_NODE_TYPES.AssignmentExpression) {
        return true;
      }

      if (expression.type === AST_NODE_TYPES.UpdateExpression) {
        return true;
      }

      if (expression.type === AST_NODE_TYPES.AwaitExpression) {
        return true;
      }

      continue;
    }

    // VariableDeclaration — meaningful (assigning something)
    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      return true;
    }

    // Control flow statements — meaningful
    if (
      statement.type === AST_NODE_TYPES.IfStatement ||
      statement.type === AST_NODE_TYPES.SwitchStatement ||
      statement.type === AST_NODE_TYPES.ForStatement ||
      statement.type === AST_NODE_TYPES.ForInStatement ||
      statement.type === AST_NODE_TYPES.ForOfStatement ||
      statement.type === AST_NODE_TYPES.WhileStatement ||
      statement.type === AST_NODE_TYPES.TryStatement
    ) {
      return true;
    }
  }

  return false;
};
