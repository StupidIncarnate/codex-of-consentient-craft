/**
 * PURPOSE: Flattens the ward-result detail blob into human-readable breakdown lines — one per
 * lint/typecheck error and one per test failure — each prefixed with its check type. A project that
 * FAILED with no structured errors and no test failures (a suite that crashed / failed to run) gets
 * a `<check>: <project> — FAILED` summary line plus its rawOutput, so the breakdown is never empty
 * under a failed [WARD] row. Used to render the failure breakdown under an expanded failed [WARD]
 * execution row.
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

      // Crash project: failed with no structured errors and no test failures (a suite that
      // crashed / failed to run). Render a FAILED summary plus the rawOutput tail so the
      // breakdown is never empty under a failed [WARD] row.
      const crashed =
        projectResult.status === 'fail' &&
        (projectResult.errors ?? []).length === 0 &&
        (projectResult.testFailures ?? []).length === 0;

      if (crashed) {
        const projectName =
          projectResult.projectFolder?.name === undefined
            ? 'unknown'
            : String(projectResult.projectFolder.name);
        lines.push(wardDetailLineContract.parse(`${label}: ${projectName} — FAILED`));

        const stdout = projectResult.rawOutput?.stdout;
        if (typeof stdout === 'string' && stdout.trim().length > 0) {
          lines.push(wardDetailLineContract.parse(String(stdout)));
        }

        const stderr = projectResult.rawOutput?.stderr;
        if (typeof stderr === 'string' && stderr.trim().length > 0) {
          lines.push(wardDetailLineContract.parse(String(stderr)));
        }
      }
    }
  }

  return lines;
};
