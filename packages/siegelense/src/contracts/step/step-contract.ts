/**
 * PURPOSE: The step verbs a `run` batch carries as DATA rather than as separate MCP tools
 * (siegelense-tooling.md line 26 — "the TOOL surface is bounded and the STEP surface is open").
 * A `z.discriminatedUnion('step', …)` rather than one object with ten optional fields, so an invalid
 * combination — a `goto` carrying a `ref`, a `click` with no handle at all — is rejected by THIS
 * contract instead of surfacing three steps later inside a broker. Every member is `.strict()`: a
 * plain Zod object silently STRIPS an unrecognized key rather than rejecting it, and a field that
 * belongs to a different verb — or a misspelled one — is otherwise gone with no signal, the same
 * clean-looking-result failure siegelense-tooling.md line 2204 bans for a stored `ref`. Reach for
 * this over `stepVerbContract` whenever the value is a whole step a batch will run; StepVerb only
 * names which verb it is.
 *
 * **A driving step takes a `target` OR a `ref`, never both and never neither.** The two are
 * different KINDS of handle rather than two spellings of one: a `target` plus a `within` is durable
 * and means the same element the next time anyone runs it, so it is what belongs in a saved batch,
 * while a `ref` is minted by one `look` against one page state on one instance and is for driving
 * right now (line 2168). Accepting both would let a caller write a step whose two handles disagree,
 * and the tool would then have to pick — which is the no-pick rule broken at the contract layer.
 *
 * USAGE:
 * stepContract.parse({ step: 'click', target: '[data-testid="GUILD_ADD"]' });
 * // Returns the 'click' member of the Step union, with `node` and `expect` filled in
 *
 * stepContract.parse({ step: 'look', within: 'SUBAGENT_CHAIN' });
 * // Returns the 'look' member, scoped to one region — rung 2 of the reading ladder
 *
 * stepContract.parse({ step: 'seed', recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' });
 * // Returns the 'seed' member, with the recipe's own parameters kept as top-level keys
 */

import { z } from 'zod';

import {
  contentTextContract,
  fileNameContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';
import { recipeNameContract } from '@dungeonmaster/siegelense-recipes/contracts';

import { locatorStateContract } from '../locator-state/locator-state-contract';
import { seedBindingNameContract } from '../seed-binding-name/seed-binding-name-contract';
import { nodeLabelContract } from '../node-label/node-label-contract';
import { refContract } from '../ref/ref-contract';
import { selectorContract } from '../selector/selector-contract';
import { evidenceFileStatics } from '../../statics/evidence-file/evidence-file-statics';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepStatics } from '../../statics/step/step-statics';
import { stepPathContract } from '../step-path/step-path-contract';

const HANDLE_MESSAGE =
  'a driving step takes exactly one handle: a `target` selector — durable, meaning the same element on the next run, so it is what belongs in a saved batch — or a `ref`, which one `look` minted against this instance and this page state and which is for driving right now. Try { "step": "click", "target": "[data-testid=PIXEL_BTN]", "within": "[data-testid=GUILD_LIST]" } or { "step": "click", "ref": 23 }';

export const stepContract = z
  .discriminatedUnion('step', [
    z
      .object({
        step: z.literal('goto'),
        // `stepPathContract`, not `urlPathContract`: the spec's own worked batches write a goto
        // whose WHOLE path is a `{s.sessions.nested}` placeholder (lines 2793, 2922), and that
        // value cannot start with `/` at the moment the batch is parsed — the recipe minting it
        // has not run. A step is parsed again after substitution, where the `/` rule is the only
        // branch left.
        path: stepPathContract,
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
        target: selectorContract.nullable().default(null),
        within: selectorContract.nullable().default(null),
        ref: refContract.nullable().default(null),
        timeoutMs: timeoutMsContract.nullable().default(null),
        node: nodeLabelContract.nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict(),
    z
      .object({
        step: z.literal('type'),
        target: selectorContract.nullable().default(null),
        within: selectorContract.nullable().default(null),
        ref: refContract.nullable().default(null),
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
        step: z.literal('look'),
        // The scope, and the ONLY knob this verb takes. It accepts the spec's own shorthand — a
        // bare testId, `within: 'SUBAGENT_CHAIN'` (line 2593) — as well as the explicit
        // `[data-testid="…"]` form every other step uses and the ambiguity error prints;
        // `withinSelectorNormaliseTransformer` is what makes both reach the same element, so a
        // session copying a scope out of an error and a session writing the spec's shorthand are
        // never one silent element-tag match apart.
        within: selectorContract.nullable().default(null),
        node: nodeLabelContract.nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict(),
    z
      .object({
        step: z.literal('seed'),
        recipe: recipeNameContract,
        // The name later steps read this run's ids back by — `{g.guildSlug}`. `null` when the
        // caller wants the state and not the ids (siegelense-tooling.md line 2801).
        as: seedBindingNameContract.nullable().default(null),
        node: nodeLabelContract.nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      // `.catchall()`, and this is the ONE member that is not `.strict()`. A recipe's parameters
      // ride the step as TOP-LEVEL keys — `{ step: 'seed', recipe: 'session-with-nested-subagent',
      // guild: '{g.guildId}', as: 's' }` — which is the form every worked batch in the spec writes
      // (lines 2792, 2915-2922, 2941). The loudness the other members get from `.strict()` is
      // supplied one layer up and better: `recipeSeedRunBroker` grades every extra key against the
      // named recipe's own declared `parameters` and refuses a missing or unknown one BY NAME.
      // Zod cannot do that check, because only the manifest knows what a given recipe takes.
      .catchall(contentTextContract),
  ])
  // `.refine()` returns a ZodEffects and `z.discriminatedUnion` accepts only ZodObjects, so the
  // cross-field handle rule rides the UNION rather than the two members it governs. It reads the
  // discriminator itself to stay narrow: `goto` carries neither field and must never be graded
  // against a rule about handles.
  .superRefine((step, context) => {
    if (step.step !== 'click' && step.step !== 'type') {
      return;
    }
    if ((step.target === null) === (step.ref === null)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: HANDLE_MESSAGE, path: ['target'] });
    }
  });

export type Step = z.infer<typeof stepContract>;
