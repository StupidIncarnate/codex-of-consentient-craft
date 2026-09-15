/**
 * PURPOSE: The six step verbs a `run` batch carries as DATA rather than as six separate MCP tools
 * (siegelense-tooling.md line 26 — "the TOOL surface is bounded and the STEP surface is open").
 * A `z.discriminatedUnion('step', …)` rather than one object with ten optional fields, so an invalid
 * combination — a `goto` carrying a `ref`, a `click` with no `target` at all — is rejected by THIS
 * contract instead of surfacing three steps later inside a broker. Every member is `.strict()`: a
 * plain Zod object silently STRIPS an unrecognized key rather than rejecting it, and a field that
 * belongs to a different verb — or a misspelled one — is otherwise gone with no signal, the same
 * clean-looking-result failure siegelense-tooling.md line 2078 bans for a stored `ref`. Reach for
 * this over `stepVerbContract` whenever the value is a whole step a batch will run; StepVerb only
 * names which of the six it is.
 *
 * USAGE:
 * stepContract.parse({ step: 'click', target: '[data-testid="GUILD_ADD"]' });
 * // Returns the 'click' member of the Step union, with `node` and `expect` filled in
 */

import { z } from 'zod';

import {
  contentTextContract,
  fileNameContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';

import { locatorStateContract } from '../locator-state/locator-state-contract';
import { nodeLabelContract } from '../node-label/node-label-contract';
import { selectorContract } from '../selector/selector-contract';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepStatics } from '../../statics/step/step-statics';
import { urlPathContract } from '../url-path/url-path-contract';

export const stepContract = z.discriminatedUnion('step', [
  z
    .object({
      step: z.literal('goto'),
      path: urlPathContract,
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('waitFor'),
      target: selectorContract,
      within: selectorContract.nullable(),
      state: locatorStateContract,
      timeoutMs: timeoutMsContract.nullable(),
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('click'),
      target: selectorContract,
      within: selectorContract.nullable(),
      timeoutMs: timeoutMsContract.nullable(),
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('type'),
      target: selectorContract,
      within: selectorContract.nullable(),
      value: contentTextContract,
      timeoutMs: timeoutMsContract.nullable(),
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('screenshot'),
      name: fileNameContract,
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('eval'),
      source: contentTextContract,
      node: nodeLabelContract.nullable(),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
]);

export type Step = z.infer<typeof stepContract>;
