/**
 * PURPOSE: The `profile` call's own entry — parses argv into a `ProfileArgs` and hands it straight
 * to `SiegelenseProfileResponder`. `profile` starts nothing and needs no branching beyond that
 * (`siegelense-profile-responder.ts`'s own header), so this layer composes exactly the two steps the
 * call requires: parse, then respond. `siegelense-flow.ts` routes `profile` here.
 *
 * USAGE:
 * await SiegelenseProfileLayerFlow({ callArgs: ['--spec', 'dungeonmaster-api'] });
 * // Parses the argv into ProfileArgs and returns the AdapterResult SiegelenseProfileResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseProfileResponder } from '../../responders/siegelense/profile/siegelense-profile-responder';
import { profileArgsParseTransformer } from '../../transformers/profile-args-parse/profile-args-parse-transformer';

export const SiegelenseProfileLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelenseProfileResponder(profileArgsParseTransformer({ args: callArgs }));
