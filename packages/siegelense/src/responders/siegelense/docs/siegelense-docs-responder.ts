/**
 * PURPOSE: The surface `dungeonmaster siegelense docs [--for <scope>] [--human]` serves — one JSON
 * document on stdout by default (the raw `DocsAnswer`), or the plain-text manual through
 * `docsAnswerRenderTransformer` when `human` is true. Writes through `process.stdout.write`, never
 * `console.log`, matching every other siegelense call.
 *
 * It reaches no broker, and that is the shape rather than an omission: the manual is immutable
 * data, so turning a scope name into a document is a pure transformation. `--help` already works
 * this way — statics, one render transformer, no broker between them — and a `docsReadBroker` that
 * only forwarded to the compose transformer would be indirection with nothing inside it.
 *
 * It starts nothing, holds no pool slot and touches no instance: a session reads this BEFORE it
 * knows how to boot one. Nothing here is awaited, so the return is an explicit `Promise.resolve`
 * rather than a bare value — `SiegelenseFlow`'s route table is typed on a promise, and this keeps
 * the call's entry the same shape as its siblings that really do wait on a broker.
 *
 * USAGE:
 * await SiegelenseDocsResponder({ scope: null, human: false });
 * // Writes every scope as one JSON document
 *
 * await SiegelenseDocsResponder({ scope: docsScopeContract.parse('walking'), human: true });
 * // Writes the walker's page as indented text
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DocsScope } from '../../../contracts/docs-scope/docs-scope-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../../transformers/docs-answer-render/docs-answer-render-transformer';

export const SiegelenseDocsResponder = async ({
  scope,
  human,
}: {
  scope: DocsScope | null;
  human: boolean;
}): Promise<AdapterResult> => {
  const answer = docsAnswerComposeTransformer({ scope });

  process.stdout.write(
    human
      ? docsAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );

  return Promise.resolve(adapterResultContract.parse({ success: true }));
};
