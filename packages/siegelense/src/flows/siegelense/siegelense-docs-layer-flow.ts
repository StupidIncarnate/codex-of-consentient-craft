/**
 * PURPOSE: The `docs` call's own entry — parses argv into a `DocsArgs` and hands it straight to
 * `SiegelenseDocsResponder`. `docs` reaches no broker and starts nothing
 * (`siegelense-docs-responder.ts`'s own header), so this layer composes exactly the two steps the
 * call requires: parse, then respond. `siegelense-flow.ts` routes `docs` here.
 *
 * USAGE:
 * await SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking'] });
 * // Parses the argv into DocsArgs and returns the AdapterResult SiegelenseDocsResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseDocsResponder } from '../../responders/siegelense/docs/siegelense-docs-responder';
import { docsArgsParseTransformer } from '../../transformers/docs-args-parse/docs-args-parse-transformer';

export const SiegelenseDocsLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => SiegelenseDocsResponder(docsArgsParseTransformer({ args: callArgs }));
