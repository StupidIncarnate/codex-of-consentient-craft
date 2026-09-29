/**
 * PURPOSE: Renders a `ResultsAnswer` into a concise, token-efficient human view — an instance
 * header, the run summary when the query named no kind and no step (`storedReturn`), and
 * formatted step readings, or a notice when none matched. Both the summary and the readings print
 * together for that default query: an agent that reads only the summary line never learns the
 * readings existed, so the header is followed by whichever of the two the answer actually carries,
 * concatenated when both do. `kind: 'console'` and `kind: 'network'` rows get their own dedicated
 * line shape — a bare message hides whether it was an error or a warning, and a raw JSON network
 * line hides the one thing a reader actually wants (method, status, url, body) behind property
 * names they have to parse first. Every other kind falls through to the generic
 * content/reading/text/message shape a step reading, a screenshot or a websocket frame carries.
 * An EMPTY answer for a kind says what was looked for and for which window — `0 network requests
 * during run_7` — then what the answer knows about where that evidence is instead: the latest run
 * holding lines of that kind (`latestRunWithRows`), or the `api-server.log` byte range the steps
 * covered (`serverWindow`). A bare "none found" reads the same for a clean run, a run that was never
 * recorded, and the wrong run, and those are three different next moves. An answer with no kind, or
 * for an `unknown`/`pruned` instance whose state already says why, keeps the plain notice.
 * Pure, keeping human formatting separate from the read broker and the CLI responder.
 *
 * USAGE:
 * resultsAnswerRenderTransformer({ answer: ResultsAnswerStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21 (alive)\nREADINGS: none found for query\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import type { ResultsAnswer } from '../../contracts/results-answer/results-answer-contract';
import { resultsStatics } from '../../statics/results/results-statics';
import { networkBodyTrimTransformer } from '../network-body-trim/network-body-trim-transformer';
import { stepReadingTextRenderTransformer } from '../step-reading-text-render/step-reading-text-render-transformer';
import { runAnswerRenderTransformer } from '../run-answer-render/run-answer-render-transformer';

export const resultsAnswerRenderTransformer = ({
  answer,
}: {
  answer: ResultsAnswer;
}): ContentText => {
  const header = `INSTANCE: ${answer.instanceId} (${answer.instanceState})`;

  const lines = answer.rows.map((row) => {
    const parsed = safeJsonParseTransformer({ value: row });
    if (!parsed.ok || typeof parsed.value !== 'object' || parsed.value === null) {
      return row;
    }
    const record = parsed.value as Record<PropertyKey, unknown>;

    // Only a `--since boot` row carries `run`; a single run's rows keep their bare shape.
    const atDate = typeof record.at === 'number' ? new Date(record.at) : null;
    const stamp = [
      typeof record.run === 'string' ? record.run : 'run' in record ? 'between runs' : null,
      typeof record.step === 'number' ? `step ${String(record.step)}` : null,
      atDate === null || Number.isNaN(atDate.getTime()) ? null : atDate.toISOString(),
    ].filter((part) => part !== null);
    const stampPrefix = 'run' in record ? `[${stamp.join(' ')}] ` : '';

    if (answer.kind === 'console' && typeof record.text === 'string') {
      const level = typeof record.type === 'string' ? record.type : 'log';
      return `${stampPrefix}${level.toUpperCase()}: ${record.text}`;
    }

    if (
      answer.kind === 'ws' &&
      typeof record.direction === 'string' &&
      typeof record.url === 'string'
    ) {
      const payload = typeof record.payload === 'string' ? record.payload : '';
      const frame = `${stampPrefix}${record.direction} ${record.url}`;
      return payload.length === 0
        ? frame
        : `${frame} — ${networkBodyTrimTransformer({ body: contentTextContract.parse(payload) })}`;
    }

    if (answer.kind === 'network' && typeof record.method === 'string') {
      const url = typeof record.url === 'string' ? record.url : '';
      const status = typeof record.status === 'number' ? String(record.status) : 'ERR';
      const bodySource =
        typeof record.responseBody === 'string' && record.responseBody.length > 0
          ? record.responseBody
          : typeof record.requestBody === 'string' && record.requestBody.length > 0
            ? record.requestBody
            : '';
      const exchange = `${stampPrefix}${record.method} ${status} ${url}`;
      return bodySource.length === 0
        ? exchange
        : `${exchange} — ${networkBodyTrimTransformer({ body: contentTextContract.parse(bodySource) })}`;
    }

    const step = typeof record.step === 'number' ? record.step : answer.step;
    const verb = typeof record.verb === 'string' ? record.verb : answer.verb;
    const rawContent =
      typeof record.content === 'string'
        ? record.content
        : typeof record.reading === 'string'
          ? record.reading
          : typeof record.text === 'string'
            ? record.text
            : typeof record.message === 'string'
              ? record.message
              : null;
    const content =
      rawContent === null
        ? JSON.stringify(record)
        : stepReadingTextRenderTransformer({ verb, reading: rawContent });

    if (step !== null && verb !== null) {
      return `[step ${step}] ${verb}: ${content}`;
    }
    if (step !== null) {
      return `[step ${step}]: ${content}`;
    }
    if (verb !== null) {
      return `[${verb}]: ${content}`;
    }
    return content;
  });

  if (answer.storedReturn !== null) {
    const summary = `${header}\n${runAnswerRenderTransformer({ result: answer.storedReturn })}`;
    return contentTextContract.parse(
      lines.length === 0 ? summary : `${summary}${lines.join('\n')}\n`,
    );
  }

  if (lines.length === 0) {
    const { kind } = answer;
    if (kind === null || answer.instanceState === 'unknown' || answer.instanceState === 'pruned') {
      return contentTextContract.parse(`${header}\nREADINGS: none found for query\n`);
    }

    const noun =
      Object.entries(resultsStatics.render.emptyNouns).find(([name]) => name === kind)?.[1] ??
      `${String(kind)} readings`;
    const stepText = answer.step === null ? '' : ` step ${String(answer.step)}`;
    const scope = answer.runId === null ? 'since boot' : `during ${answer.runId}${stepText}`;
    const latest = answer.latestRunWithRows;
    const window = answer.serverWindow;

    const latestText =
      latest === undefined
        ? ''
        : latest === null
          ? ` Nothing of this kind was recorded on this instance at all.`
          : latest.runId === answer.runId
            ? ` ${latest.runId} holds ${String(latest.rows)} ${noun} in all; none match this query's step or filter.`
            : ` Each run holds only what arrived during its own steps; the latest ${noun} on this instance are ${String(latest.rows)} from ${latest.runId} — read them with --run ${latest.runId}, or --since boot for the whole timeline.`;
    const windowText =
      window === undefined
        ? ''
        : window === null
          ? ' No step in this query recorded a server log window.'
          : ` Covered api-server.log bytes ${String(window.fromByte)}-${String(window.toByte)}${window.fromByte === window.toByte ? ': the server wrote nothing while these steps ran' : ''}.`;

    return contentTextContract.parse(
      `${header}\nREADINGS: 0 ${noun} ${scope}.${latestText}${windowText}\n`,
    );
  }

  return contentTextContract.parse(`${header}\n${lines.join('\n')}\n`);
};
