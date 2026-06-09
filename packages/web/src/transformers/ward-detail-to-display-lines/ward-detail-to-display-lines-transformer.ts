/**
 * PURPOSE: Flattens the ward-result detail blob into human-readable breakdown lines — one per
 * lint/typecheck error and one per test failure — each prefixed with its check type. A project that
 * FAILED with no structured errors and no test failures (a suite that crashed / failed to run) gets
 * a `<check>: <project> — FAILED` summary line plus its rawOutput, so the breakdown is never empty
 * under a failed [WARD] row. A check ward flagged with `discoveryMismatch` (files discovered ≠ files
 * processed — the run-fails-with-every-check-pass/skip case) gets a `<check>: DISCOVERY MISMATCH —
 * N discovered, M processed` summary plus one line per discovered-but-unrun / processed-but-
 * undiscovered file, so that failure mode is never a blank `ward_failed` either. The mismatch
 * verdict is ward's (it owns the passthrough-suppression rule); this transformer only renders the
 * flag ward set. Used to render the failure breakdown under an expanded failed [WARD] execution row.
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

    if (check.discoveryMismatch === true) {
      const projects = check.projectResults ?? [];
      const totalDiscovered = projects.reduce(
        (sum, pr) => sum + Number(pr.discoveredCount ?? 0),
        0,
      );
      const totalProcessed = projects.reduce((sum, pr) => sum + Number(pr.filesCount ?? 0), 0);
      lines.push(
        wardDetailLineContract.parse(
          `${label}: DISCOVERY MISMATCH — ${String(totalDiscovered)} discovered, ${String(totalProcessed)} processed`,
        ),
      );

      for (const projectResult of projects) {
        for (const file of projectResult.onlyDiscovered ?? []) {
          lines.push(wardDetailLineContract.parse(`${label}: only discovered — ${String(file)}`));
        }
        for (const file of projectResult.onlyProcessed ?? []) {
          lines.push(wardDetailLineContract.parse(`${label}: only processed — ${String(file)}`));
        }
      }
    }

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
