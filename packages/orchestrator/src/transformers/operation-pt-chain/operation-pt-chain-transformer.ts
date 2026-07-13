/**
 * PURPOSE: Resolves an operation item's pt-continuation chain — the base text (with any leading
 * "pt N: " prefix stripped) and how many items of the same role already belong to that chain.
 *
 * USAGE:
 * const { base, chainLength } = operationPtChainTransformer({ operations, item });
 * // For item text "pt 2: core: config adapter" with the original also on the ledger:
 * // base = 'core: config adapter', chainLength = 2 — the next continuation is "pt 3: {base}".
 */

import type { OperationItem } from '@dungeonmaster/shared/contracts';

const PT_PREFIX = /^pt \d+: /u;

export const operationPtChainTransformer = ({
  operations,
  item,
}: {
  operations: OperationItem[];
  item: OperationItem;
}): { base: string; chainLength: number } => {
  const base = String(item.text).replace(PT_PREFIX, '');

  const chainLength = operations.filter(
    (operation) =>
      operation.role === item.role && String(operation.text).replace(PT_PREFIX, '') === base,
  ).length;

  return { base, chainLength };
};
