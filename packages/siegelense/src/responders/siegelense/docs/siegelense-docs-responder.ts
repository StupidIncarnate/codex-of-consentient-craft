/**
 * PURPOSE: The surface `dungeonmaster siegelense docs --for <scope> [--json]` serves —
 * clean, readable Markdown on stdout by default through `docsAnswerRenderTransformer`, or the raw
 * `DocsAnswer` JSON document when `json` is true. Writes through `process.stdout.write`, never
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
 * await SiegelenseDocsResponder({ scope: docsScopeContract.parse('operating'), json: false });
 * // Writes the operating instructions as formatted Markdown
 *
 * await SiegelenseDocsResponder({ scope: docsScopeContract.parse('walking'), json: true });
 * // Writes the walker's page as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DocsScope } from '../../../contracts/docs-scope/docs-scope-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../../transformers/docs-answer-render/docs-answer-render-transformer';

export const SiegelenseDocsResponder = async ({
  scope,
  json,
}: {
  scope: DocsScope;
  json: boolean;
}): Promise<AdapterResult> => {
  const answer = docsAnswerComposeTransformer({ scope });

  process.stdout.write(
    json
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : docsAnswerRenderTransformer({ answer }),
  );

  return Promise.resolve(adapterResultContract.parse({ success: true }));
};
