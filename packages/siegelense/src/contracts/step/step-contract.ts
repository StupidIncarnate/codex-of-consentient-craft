/**
 * PURPOSE: The step verbs a `run` batch carries as DATA rather than as separate MCP tools
 * (siegelense-tooling.md line 26 — "the TOOL surface is bounded and the STEP surface is open").
 * A `z.discriminatedUnion('step', …)` rather than one object with every field optional, so an
 * invalid combination — a `goto` carrying a `ref`, a `click` with no `target` at all — is rejected by
 * THIS contract instead of surfacing three steps later inside a broker. Every member is `.strict()`: a
 * plain Zod object silently STRIPS an unrecognized key rather than rejecting it, and a field that
 * belongs to a different verb — or a misspelled one — is otherwise gone with no signal, the same
 * clean-looking-result failure siegelense-tooling.md line 2078 bans for a stored `ref`. Reach for
 * this over `stepVerbContract` whenever the value is a whole step a batch will run; StepVerb only
 * names which member it is.
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
import { recipeInputKeyContract } from '../recipe-input-key/recipe-input-key-contract';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import { selectorContract } from '../selector/selector-contract';
import { stepOutputNameContract } from '../step-output-name/step-output-name-contract';
import { stepRefContract } from '../step-ref/step-ref-contract';
import { evidenceFileStatics } from '../../statics/evidence-file/evidence-file-statics';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepStatics } from '../../statics/step/step-statics';
import { urlPathContract } from '../url-path/url-path-contract';

export const stepContract = z.discriminatedUnion('step', [
  z
    .object({
      step: z.literal('goto'),
      // A reference is admitted alongside a literal path because a seed mints ids no file
      // contains (siegelense-recipes.md:2090-2091) — `{s.nested.url}` does not start with `/`, so
      // `urlPathContract` alone would refuse it. Resolving the reference into a real path is a run's
      // job (holding earlier steps' outputs), not this contract's.
      path: urlPathContract.or(stepRefContract),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('waitFor'),
      target: selectorContract,
      within: selectorContract.nullable().default(null),
      state: locatorStateContract,
      timeoutMs: timeoutMsContract.nullable().default(null),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('click'),
      target: selectorContract,
      within: selectorContract.nullable().default(null),
      timeoutMs: timeoutMsContract.nullable().default(null),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('type'),
      target: selectorContract,
      within: selectorContract.nullable().default(null),
      value: contentTextContract,
      timeoutMs: timeoutMsContract.nullable().default(null),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('screenshot'),
      // Playwright picks the image format off the path's extension and refuses a path carrying
      // none, with `path: unsupported mime type "null"` — a message naming neither the step nor
      // the field the caller typed. The extension is a real constraint rather than a formatting
      // preference: every reader of this tree decodes PNG (`shotBlankReadBroker`,
      // `shotChangeReadBroker`, and `compare`'s pixel path), so refusing here is what keeps a
      // capture readable by the calls that exist to read it.
      name: fileNameContract.refine(
        (candidate) => candidate.endsWith(evidenceFileStatics.extensions.shot),
        {
          message: `a screenshot name must end in "${evidenceFileStatics.extensions.shot}" — the capture is a PNG and every call that reads one decodes it as such. Try { "step": "screenshot", "name": "after-create${evidenceFileStatics.extensions.shot}" }`,
        },
      ),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('eval'),
      source: contentTextContract,
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
  z
    .object({
      step: z.literal('seed'),
      recipe: recipeNameContract,
      // Its own object, never flattened onto the step — a recipe input named `as`, `step` or
      // `recipe` would shadow the step's own keys, and the collision would be silent
      // (siegelense-tooling.md lines 882-883).
      params: z.record(recipeInputKeyContract, z.unknown()).nullable().default(null),
      as: stepOutputNameContract.nullable().default(null),
      node: nodeLabelContract.nullable().default(null),
      expect: stepExpectationContract.default(stepStatics.defaults.expect),
    })
    .strict(),
]);

export type Step = z.infer<typeof stepContract>;
