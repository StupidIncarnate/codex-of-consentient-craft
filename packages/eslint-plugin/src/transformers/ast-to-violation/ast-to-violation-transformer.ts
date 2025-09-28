import type { AstNode } from '../../contracts/ast-node/ast-node-contract';
import type { RuleViolation } from '../../contracts/rule-violation/rule-violation-contract';

export const astToViolationTransformer = ({
  node,
  message,
  messageId,
  data,
}: {
  node: AstNode;
  message: string;
  messageId?: string;
  data?: Record<string, unknown>;
}): RuleViolation => ({
  node,
  message: message as RuleViolation['message'],
  messageId: messageId as RuleViolation['messageId'],
  data,
});
