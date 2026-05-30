/**
 * PURPOSE: Flattens the ward-result detail blob into human-readable breakdown lines — one per
 * lint/typecheck error and one per test failure — each prefixed with its check type. Used to render
 * the failure breakdown under an expanded failed [WARD] execution row.
 *
 * USAGE:
 * wardDetailToDisplayLinesTransformer({ detail });
 * // Returns: ['lint: src/index.ts:10 — Unexpected any [no-explicit-any]', 'unit: a.test.ts › t — boom']
 * // Returns [] when detail does not parse or contains no failures.
 */

import { wardDetailContract } from '../../contracts/ward-detail/ward-detail-contract';
import { wardDetailLineContract } from '../../contracts/ward-detail-line/ward-detail-line-contract';
import type { WardDetailLine } from '../../contracts/ward-detail-line/ward-detail-line-contract';

export const wardDetailToDisplayLinesTransformer = ({
  detail,
}: {
  detail: unknown;
}): WardDetailLine[] => {
  const parsed = wardDetailContract.safeParse(detail);

  if (!parsed.success) {
    return [];
  }

  const lines: WardDetailLine[] = [];

  for (const check of parsed.data.checks ?? []) {
    const label = check.checkType === undefined ? 'check' : String(check.checkType);

    for (const projectResult of check.projectResults ?? []) {
      for (const error of projectResult.errors ?? []) {
        const file = error.filePath === undefined ? '' : String(error.filePath);
        const location = error.line === undefined ? '' : `:${String(error.line)}`;
        const message = error.message === undefined ? '' : String(error.message);
        const rule = error.rule === undefined ? '' : ` [${String(error.rule)}]`;
        lines.push(
          wardDetailLineContract.parse(`${label}: ${file}${location} — ${message}${rule}`),
        );
      }

      for (const failure of projectResult.testFailures ?? []) {
        const suite = failure.suitePath === undefined ? '' : String(failure.suitePath);
        const name = failure.testName === undefined ? '' : ` › ${String(failure.testName)}`;
        const message = failure.message === undefined ? '' : ` — ${String(failure.message)}`;
        lines.push(wardDetailLineContract.parse(`${label}: ${suite}${name}${message}`));
      }
    }
  }

  return lines;
};
