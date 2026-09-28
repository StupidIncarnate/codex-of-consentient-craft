/**
 * PURPOSE: Finds the structure that makes an adapter more than a forwarded call: a `try` with a
 * `catch`, and any branching (`if`, `?:`, `switch`, a loop, `&&`, `||`, `??`). Each reason is
 * reported once, whatever the count.
 *
 * USAGE:
 * adapterAnalysisAnalyzeStructureLayerBroker({ nodes });
 * // Returns ['try-catch', 'branching'] for an adapter that has both
 */
import * as ts from '#gateway/npm/typescript';
import { adapterLogicReasonContract } from '../../../contracts/adapter-logic-reason/adapter-logic-reason-contract';
import type { AdapterLogicReason } from '../../../contracts/adapter-logic-reason/adapter-logic-reason-contract';

export const adapterAnalysisAnalyzeStructureLayerBroker = ({
  nodes,
}: {
  nodes: readonly ts.Node[];
}): AdapterLogicReason[] => {
  const branchOperators = [
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.QuestionQuestionToken,
  ];
  const hasTryCatch = nodes.some(
    (node) => ts.isTryStatement(node) && node.catchClause !== undefined,
  );
  const hasBranching = nodes.some(
    (node) =>
      ts.isIfStatement(node) ||
      ts.isConditionalExpression(node) ||
      ts.isSwitchStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      (ts.isBinaryExpression(node) && branchOperators.includes(node.operatorToken.kind)),
  );

  return [
    ...(hasTryCatch ? [adapterLogicReasonContract.parse('try-catch')] : []),
    ...(hasBranching ? [adapterLogicReasonContract.parse('branching')] : []),
  ];
};
