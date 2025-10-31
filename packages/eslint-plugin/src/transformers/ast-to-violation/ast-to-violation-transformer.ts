/**
 * PURPOSE: Converts an AST node and error message into a standardized rule violation object
 *
 * USAGE:
 * const violation = astToViolationTransformer({
 *   node: astNode,
 *   message: 'Expected export name to match filename',
 *   messageId: 'invalidName'
 * });
 * // Returns { node, message, messageId, data }
 *
 * WHEN-TO-USE: When reporting ESLint rule violations from custom rules
 */
import type { AstNode } from '../../contracts/ast-node/ast-node-contract';
import type { RuleViolation } from '../../contracts/rule-violation/rule-violation-contract';

export const astToViolationTransformer = ({
  node,
  message,
  messageId,
  data,
}: {
  node: AstNode;
  message: RuleViolation['message'];
  messageId?: RuleViolation['messageId'];
  data?: Record<string, unknown>;
}): RuleViolation => ({
  node,
  message,
  messageId,
  data,
});
