/**
 * PURPOSE: Renders a `CompareAnswer` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense compare` CLI surface — instance id, runs compared, error deltas across
 * console, server, and network, the pixel diff summary, and each run's own element churn. Pure,
 * so the rendered summary is provable without stdout. The two ELEMENTS lines are labelled "WITHIN
 * RUN A"/"WITHIN RUN B" on purpose: `elements.runA`/`elements.runB` are each that run's OWN last
 * recorded delta (appeared/disappeared/changed against its own previous step), never a diff between
 * run A and run B — `compare` reads stored evidence only, never re-drives a page to compute a fresh
 * cross-run diff, so a label reading "RUN A" beside "RUN B" would misread as one. The counts here
 * carry `+appeared -disappeared ~changed` only — the real `KeyRow`s each side recorded are in
 * `elements.runA`/`elements.runB` on the answer itself, reachable via `--json`, the same split this
 * transformer already makes for `console`/`server`/`network`'s own `new:` lines.
 *
 * USAGE:
 * compareAnswerRenderTransformer({ answer: CompareAnswerStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12%\nELEMENTS WITHIN RUN A: +0 -0 ~0\nELEMENTS WITHIN RUN B: +0 -0 ~0\n'
 */

import type { CompareAnswer } from '../../contracts/compare-answer/compare-answer-contract';

export const compareAnswerRenderTransformer = ({ answer }: { answer: CompareAnswer }): string => {
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

  const elementsRunA =
    answer.elements.runA === null
      ? 'none'
      : `+${String(answer.elements.runA.appeared.length)} -${String(answer.elements.runA.disappeared.length)} ~${String(answer.elements.runA.changed.length)}`;

  const elementsRunB =
    answer.elements.runB === null
      ? 'none'
      : `+${String(answer.elements.runB.appeared.length)} -${String(answer.elements.runB.disappeared.length)} ~${String(answer.elements.runB.changed.length)}`;

  return [
    `INSTANCE: ${answer.instanceId}`,
    `COMPARING: ${answer.runA} -> ${answer.runB}`,
    `CONSOLE ERRORS: ${consoleDelta}`,
    `SERVER ERRORS: ${serverDelta}`,
    `NETWORK NON-2XX: ${networkDelta}`,
    `PIXEL DELTA: ${pixelDelta}`,
    `ELEMENTS WITHIN RUN A: ${elementsRunA}`,
    `ELEMENTS WITHIN RUN B: ${elementsRunB}`,
    '',
  ].join('\n');
};
