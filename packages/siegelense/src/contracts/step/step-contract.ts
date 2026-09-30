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
 *
 * stepContract.parse({ step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 });
 * // Returns the 'until' member, waiting on the ONE condition field the caller set
 */

import { z } from '#gateway/npm/zod';

import { domFieldContract } from '../dom-field/dom-field-contract';
import { domTextModeContract } from '../dom-text-mode/dom-text-mode-contract';
import { httpMethodContract } from '../http-method/http-method-contract';
import { locatorStateContract } from '../locator-state/locator-state-contract';
import { evidenceFileStatics } from '../../statics/evidence-file/evidence-file-statics';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepStatics } from '../../statics/step/step-statics';
import { stepRefStatics } from '../../statics/step-ref/step-ref-statics';
import { holdStatics } from '../../statics/hold/hold-statics';
import { storageStatics } from '../../statics/storage/storage-statics';
import { untilResponseContract } from '../until-response/until-response-contract';
import { resetLevelContract } from '../reset-level/reset-level-contract';
import { videoActionContract } from '../video-action/video-action-contract';
import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';
import { fileStatics } from '../../statics/file/file-statics';

const STEP_REF_SHAPE = /^\{(.+)\}$/u;

const HANDLE_MESSAGE =
  'a driving step takes exactly one handle: a `target` selector — durable, meaning the same element on the next run, so it is what belongs in a saved batch — or a `ref`, which one `look` minted against this instance and this page state and which is for driving right now. Try { "step": "click", "target": "[data-testid=PIXEL_BTN]", "within": "[data-testid=GUILD_LIST]" } or { "step": "click", "ref": 23 }';

const UNTIL_CONDITION_MESSAGE =
  'an `until` step waits on exactly one condition, never zero and never two: `visible` — a selector that has not rendered yet, { "step": "until", "visible": "[data-testid=SUBAGENT_CHAIN]", "timeoutMs": 20000 }; `predicate` — a page expression that must become truthy, { "step": "until", "predicate": "document.querySelectorAll(\'[data-testid=QUEST_ROW]\').length === 3" }; `console` — a regex SOURCE string matched against a console line\'s text, { "step": "until", "console": "hydrated" }; `response` — a network exchange by method and a path substring, { "step": "until", "response": { "method": "POST", "path": "/api/quests" }, "timeoutMs": 15000 }; or `file` — a path resolved against the lane\'s home, { "step": "until", "file": "guilds/<id>/quests/<id>/quest.json", "timeoutMs": 10000 }';

export const stepContract = z
  .discriminatedUnion('step', [
    z
      .object({
        step: z.literal('goto'),
        // A reference is admitted alongside a literal path because a seed mints ids no file
        // contains (siegelense-recipes.md:2090-2091) — `{s.nested.url}` does not start with `/`, so
        // `urlPathContract` alone would refuse it. Resolving the reference into a real path is a run's
        // job (holding earlier steps' outputs), not this contract's.
        // `.pipe()` rather than a `.refine()` on the string: the reference form parses to its
        // `{ step, row, field }` segments, which `stepRefResolveTransformer` reads by key.
        path: z
          .string()
          .startsWith('/')
          .brand<'StepPath'>()
          .or(
            z
              .string()
              .transform((raw, ctx) => {
                const match = STEP_REF_SHAPE.exec(raw);
                if (match === null) {
                  ctx.addIssue({
                    code: 'custom',
                    message: `"${raw}" is not a step reference — a reference is wrapped in braces: {step.row.field}.`,
                  });
                  return z.NEVER;
                }

                const segments = (match[1] ?? '').split('.');
                if (
                  segments.length !== stepRefStatics.grammar.segmentCount ||
                  segments.some((segment) => segment.length === 0)
                ) {
                  ctx.addIssue({
                    code: 'custom',
                    message: `Step reference "${raw}" has ${String(segments.length)} segment(s) (${segments.join('.')}) — a step reference always has three: {step.row.field}.`,
                  });
                  return z.NEVER;
                }

                return { step: segments[0], row: segments[1], field: segments[2] };
              })
              .pipe(
                z
                  .object({
                    step: z.string().min(1).brand<'StepPathStep'>(),
                    row: z.string().min(1).brand<'StepPathRow'>(),
                    field: z.string().min(1).brand<'StepPathField'>(),
                  })
                  .brand<'StepPath'>(),
              ),
          ),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('waitFor'),
        target: z.string().min(1).brand<'StepTarget'>(),
        within: z.string().min(1).brand<'StepWithin'>().nullable().default(null),
        state: locatorStateContract,
        timeoutMs: z.number().int().min(0).brand<'StepTimeoutMs'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('click'),
        target: z.string().min(1).brand<'StepTarget'>().nullable().default(null),
        within: z.string().min(1).brand<'StepWithin'>().nullable().default(null),
        ref: z.number().int().positive().brand<'StepRef'>().nullable().default(null),
        timeoutMs: z.number().int().min(0).brand<'StepTimeoutMs'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('type'),
        target: z.string().min(1).brand<'StepTarget'>().nullable().default(null),
        within: z.string().min(1).brand<'StepWithin'>().nullable().default(null),
        ref: z.number().int().positive().brand<'StepRef'>().nullable().default(null),
        value: z.string().brand<'StepValue'>(),
        timeoutMs: z.number().int().min(0).brand<'StepTimeoutMs'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('screenshot'),
        // Playwright picks the image format off the path's extension and refuses a path carrying
        // none, with `path: unsupported mime type "null"` — a message naming neither the step nor
        // the field the caller typed. The extension is a real constraint rather than a formatting
        // preference: every reader of this tree decodes PNG (`shotBlankReadBroker`,
        // `shotChangeReadBroker`, and `compare`'s pixel path), so refusing here is what keeps a
        // capture readable by the calls that exist to read it.
        name: z
          .string()
          .brand<'StepName'>()
          .refine((candidate) => candidate.endsWith(evidenceFileStatics.extensions.shot), {
            message: `a screenshot name must end in "${evidenceFileStatics.extensions.shot}" — the capture is a PNG and every call that reads one decodes it as such. Try { "step": "screenshot", "name": "after-create${evidenceFileStatics.extensions.shot}" }`,
          }),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('eval'),
        source: z.string().brand<'StepSource'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('look'),
        // The scope, and the ONLY knob this verb takes. It accepts the spec's own shorthand — a
        // bare testId, `within: 'SUBAGENT_CHAIN'` (line 2593) — as well as the explicit
        // `[data-testid="…"]` form every other step uses and the ambiguity error prints;
        // `withinSelectorNormaliseTransformer` is what makes both reach the same element, so a
        // session copying a scope out of an error and a session writing the spec's shorthand are
        // never one silent element-tag match apart.
        within: z.string().min(1).brand<'StepWithin'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('box'),
        ref: z.number().int().positive().brand<'StepRef'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('dom'),
        target: z.string().min(1).brand<'StepTarget'>(),
        fields: z.array(domFieldContract).readonly().nullable().default(null),
        text: domTextModeContract.nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('seed'),
        recipe: z
          .string()
          .min(1)
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
            'Recipe name must be kebab-case — lower-case letters, digits and single hyphens, such as "guild-with-three-quests"',
          )
          .brand<'StepRecipe'>(),
        // Its own object, never flattened onto the step — a recipe input named `as`, `step` or
        // `recipe` would shadow the step's own keys, and the collision would be silent
        // (siegelense-tooling.md lines 882-883).
        params: z.record(z.string().min(1), z.json()).nullable().default(null),
        as: z
          .string()
          .regex(
            /^[A-Za-z_][A-Za-z0-9_]*$/u,
            'A seed binding name is a bare identifier — letters, digits and underscores, starting with a letter or underscore, and no dot. The dot is what separates the binding from the field in `{g.guildSlug}`',
          )
          .brand<'StepAs'>()
          .nullable()
          .default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('until'),
        // Exactly one of these five is non-null — enforced below on the union's own
        // `.superRefine`, next to the handle rule, for the same reason: a `.refine()` returns a
        // ZodEffects and `z.discriminatedUnion` accepts only ZodObjects.
        visible: z.string().min(1).brand<'StepVisible'>().nullable().default(null),
        response: untilResponseContract.nullable().default(null),
        file: z
          .string()
          .min(1)
          .refine((candidate) => !candidate.startsWith('/'), {
            message:
              'an `until { file }` path is resolved against the lane\'s own throwaway home and must not start with "/" — a leading slash would silently wait on a file outside the lane the walk is driving. Try { "step": "until", "file": "guilds/<id>/quests/<id>/quest.json" }',
          })
          .brand<'StepFile'>()
          .nullable()
          .default(null),
        predicate: z.string().brand<'StepPredicate'>().nullable().default(null),
        console: z
          .string()
          .min(1)
          .refine(
            (candidate) =>
              !(
                candidate.length >= stepStatics.until.slashWrappedMinLength &&
                candidate.startsWith('/') &&
                candidate.endsWith('/')
              ),
            {
              message:
                'a console pattern is a regex SOURCE string, not a regex literal — JSON carries no /pattern/ syntax. Drop the surrounding slashes: { "step": "until", "console": "hydrated" }',
            },
          )
          .refine(
            (candidate) => {
              try {
                const compiled = new RegExp(candidate, 'u');
                return typeof compiled.source === 'string';
              } catch {
                return false;
              }
            },
            { message: 'a console pattern must be a compilable regular expression source' },
          )
          .brand<'StepConsole'>()
          .nullable()
          .default(null),
        timeoutMs: z.number().int().min(0).brand<'StepTimeoutMs'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('key'),
        press: z.string().brand<'StepPress'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('health'),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('resize'),
        width: z.number().int().positive().brand<'StepWidth'>(),
        height: z.number().int().positive().brand<'StepHeight'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('request'),
        method: httpMethodContract.default('GET'),
        path: z.string().brand<'StepPath'>(),
        body: z.json().optional(),
        headers: z.record(z.string(), z.string().brand<'StepHeaders'>()).optional(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('before'),
        source: z.string().brand<'StepSource'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('file'),
        path: z
          .string()
          .min(1)
          .refine((candidate) => !candidate.startsWith('/'), {
            message: fileStatics.errors.leadingSlash,
          })
          .refine((candidate) => !candidate.split('/').includes('..'), {
            message: fileStatics.errors.traversal,
          })
          .brand<'StepPath'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('storage'),
        // `.default()` before `.brand()` — zod v4 checks a `.default()` literal against the
        // schema's own output type, and a bare string can never satisfy a branded type.
        prefix: z.string().default(storageStatics.defaults.prefix).brand<'StepPrefix'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('paste'),
        target: z.string().min(1).brand<'StepTarget'>().nullable().default(null),
        within: z.string().min(1).brand<'StepWithin'>().nullable().default(null),
        ref: z.number().int().positive().brand<'StepRef'>().nullable().default(null),
        filePath: z.string().brand<'StepFilePath'>().nullable().default(null),
        value: z.string().brand<'StepValue'>().nullable().default(null),
        timeoutMs: z.number().int().min(0).brand<'StepTimeoutMs'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('hold'),
        // `.default()` before `.brand()` on both — zod v4 checks a `.default()` literal against
        // the schema's own output type, and a bare number can never satisfy a branded type.
        frames: z
          .number()
          .int()
          .min(holdStatics.defaults.minFrames)
          .default(holdStatics.defaults.frames)
          .brand<'StepFrames'>(),
        everyMs: z
          .number()
          .int()
          .positive()
          .default(holdStatics.defaults.everyMs)
          .brand<'StepEveryMs'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('video'),
        action: videoActionContract,
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('snapshot'),
        as: z
          .string()
          .min(1)
          .max(snapshotStatics.limits.maxNameLength)
          .regex(/^[A-Za-z0-9._:-]+$/u)
          .brand<'StepAs'>(),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
    z
      .object({
        step: z.literal('reset'),
        level: resetLevelContract.default('state'),
        to: z
          .string()
          .min(1)
          .max(snapshotStatics.limits.maxNameLength)
          .regex(/^[A-Za-z0-9._:-]+$/u)
          .brand<'StepTo'>()
          .nullable()
          .default(null),
        reseed: z.string().brand<'StepReseed'>().nullable().default(null),
        node: z.string().min(1).brand<'StepNode'>().nullable().default(null),
        expect: stepExpectationContract.default(stepStatics.defaults.expect),
      })
      .strict()
      .brand<'Step'>(),
  ])
  // `.refine()` returns a ZodEffects and `z.discriminatedUnion` accepts only ZodObjects, so the
  // cross-field handle rule rides the UNION rather than the two members it governs. It reads the
  // discriminator itself to stay narrow: `goto` carries neither field and must never be graded
  // against a rule about handles. `until`'s own exactly-one-condition rule rides the same union
  // for the identical reason.
  .superRefine((step, context) => {
    if (step.step === 'reset') {
      if (step.level === 'state' && step.to === null) {
        context.addIssue({
          code: 'custom',
          message: 'a reset step with level "state" requires an explicit "to" snapshot name',
          path: ['to'],
        });
      }
      return;
    }

    if (step.step === 'click' || step.step === 'type') {
      if ((step.target === null) === (step.ref === null)) {
        context.addIssue({
          code: 'custom',
          message: HANDLE_MESSAGE,
          path: ['target'],
        });
      }
      return;
    }

    if (step.step === 'paste') {
      if (step.target === null && step.ref === null) {
        context.addIssue({
          code: 'custom',
          message: 'a paste step requires at least one target handle: target or ref',
          path: ['target'],
        });
      }
      if (step.filePath === null && step.value === null) {
        context.addIssue({
          code: 'custom',
          message: 'a paste step requires at least one payload: filePath or value',
          path: ['value'],
        });
      }
      return;
    }

    if (step.step !== 'until') {
      return;
    }

    const conditionCount = [
      step.visible,
      step.response,
      step.file,
      step.predicate,
      step.console,
    ].filter((value) => value !== null).length;
    if (conditionCount !== 1) {
      context.addIssue({
        code: 'custom',
        message: UNTIL_CONDITION_MESSAGE,
        path: ['visible'],
      });
    }
  });

export type Step = z.infer<typeof stepContract>;
