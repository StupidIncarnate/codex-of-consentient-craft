/**
 * PURPOSE: Renders a `CompareAnswer` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense compare` CLI surface — instance id, runs compared, error deltas across
 * console, server, and network each followed by the lines new to run B (capped at
 * `compareRenderStatics.newLines.cap`, the rest pointed at `--json`), and the pixel diff summary
 * carrying both shot paths. Pure, so the rendered summary is provable without stdout.
 *
 * Elements print as one fixed "not compared" line, never as counts: `elements.runA`/`elements.runB`
 * are each that run's OWN last recorded delta, not a diff between run A and run B — `compare` reads
 * stored evidence only and never re-drives a page — so any count here reads as a cross-run finding
 * it is not. The per-run deltas stay on the answer itself, reachable via `--json`.
 *
 * USAGE:
 * compareAnswerRenderTransformer({ answer: CompareAnswerStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12%\nELEMENTS: not compared between the two runs (...)\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { CompareAnswer } from '../../contracts/compare-answer/compare-answer-contract';
import { compareRenderStatics } from '../../statics/compare-render/compare-render-statics';

export const compareAnswerRenderTransformer = ({
  answer,
}: {
  answer: CompareAnswer;
}): ContentText => {
  const { cap, indent, moreTemplate } = compareRenderStatics.newLines;

  const consoleDelta =
    answer.consoleErrorDelta === undefined
      ? answer.console.errors
      : `${answer.consoleErrorDelta >= 0 ? '+' : ''}${answer.consoleErrorDelta}`;

  const serverDelta =
    answer.serverErrorDelta === undefined
      ? answer.server.errors
      : `${answer.serverErrorDelta >= 0 ? '+' : ''}${answer.serverErrorDelta}`;

  const networkDelta =
    answer.networkNon2xxDelta === undefined
      ? answer.network.errors
      : `${answer.networkNon2xxDelta >= 0 ? '+' : ''}${answer.networkNon2xxDelta}`;

  const pixelDelta =
    answer.pixelDiffCount === undefined
      ? (answer.pixels ?? 'none')
      : `${answer.pixelDiffCount} pixels changed`;

  const sections = [
    { heading: `CONSOLE ERRORS: ${consoleDelta}`, lines: answer.console.new },
    { heading: `SERVER ERRORS: ${serverDelta}`, lines: answer.server.new },
    { heading: `NETWORK NON-2XX: ${networkDelta}`, lines: answer.network.new },
  ].flatMap(({ heading, lines }) => [
    heading,
    ...lines.slice(0, cap).map((line) => `${indent}${line}`),
    ...(lines.length > cap ? [moreTemplate.replace('{count}', String(lines.length - cap))] : []),
  ]);

  return contentTextContract.parse(
    [
      `INSTANCE: ${answer.instanceId}`,
      `COMPARING: ${answer.runA} -> ${answer.runB}`,
      ...sections,
      `PIXEL DELTA: ${pixelDelta}`,
      compareRenderStatics.elements.notCompared,
      '',
    ].join('\n'),
  );
};
