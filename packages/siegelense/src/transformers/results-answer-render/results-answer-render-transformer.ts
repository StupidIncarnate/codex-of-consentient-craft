/**
 * PURPOSE: Renders a `ResultsAnswer` into a concise, token-efficient human view — an instance
 * header, the run summary when the query named no kind and no step (`storedReturn`), and
 * formatted step readings, or a notice when none matched. Both the summary and the readings print
 * together for that default query: an agent that reads only the summary line never learns the
 * readings existed, so the header is followed by whichever of the two the answer actually carries,
 * concatenated when both do. Pure, keeping human formatting separate from the read broker and the
 * CLI responder.
 *
 * USAGE:
 * resultsAnswerRenderTransformer({ answer: ResultsAnswerStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21 (alive)\nREADINGS: none found for query\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import type { ResultsAnswer } from '../../contracts/results-answer/results-answer-contract';
import { runAnswerRenderTransformer } from '../run-answer-render/run-answer-render-transformer';

export const resultsAnswerRenderTransformer = ({
  answer,
}: {
  answer: ResultsAnswer;
}): ContentText => {
  const header = `INSTANCE: ${answer.instanceId} (${answer.instanceState})`;

  const lines = answer.rows.map((row) => {
    const parsed = safeJsonParseTransformer({ value: row });
    if (parsed.ok && typeof parsed.value === 'object' && parsed.value !== null) {
      const record = parsed.value as Record<PropertyKey, unknown>;
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
      const content = rawContent === null ? JSON.stringify(record) : rawContent;

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
    }
    return row;
  });

  if (answer.storedReturn !== null) {
    const summary = `${header}\n${runAnswerRenderTransformer({ result: answer.storedReturn })}`;
    return contentTextContract.parse(
      lines.length === 0 ? summary : `${summary}${lines.join('\n')}\n`,
    );
  }

  if (lines.length === 0) {
    return contentTextContract.parse(`${header}\nREADINGS: none found for query\n`);
  }

  return contentTextContract.parse(`${header}\n${lines.join('\n')}\n`);
};
