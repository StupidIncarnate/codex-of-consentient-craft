import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';
import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';
import { siegeHappyFixerStatics } from './siege-happy-fixer-statics';

const TEMPLATE = siegeHappyFixerStatics.prompt.template;

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Anything measuring the real bytes reads TEMPLATE directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_TEMPLATE = TEMPLATE.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_TEMPLATE.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('siegeHappyFixerStatics', () => {
  it('VALID: exported value => is exactly a prompt.template shape and nothing else', () => {
    expect(siegeHappyFixerStatics).toStrictEqual({
      prompt: { template: expect.stringMatching(/^.+$/su) },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(Buffer.byteLength(siegeHappyFixerStatics.prompt.template, 'utf8')).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  it('VALID: template => carries exactly one $ARGUMENTS token', () => {
    expect(TEMPLATE.split('$ARGUMENTS').length - 1).toBe(1);
  });

  describe('the four shared blocks', () => {
    // Counted rather than tested for presence: twice would mean an interpolation landed in two
    // sections, which costs this prompt's own budget twice over for one rule.
    it('VALID: template => serves spilledToolResultStatics exactly once', () => {
      expect(TEMPLATE.split(spilledToolResultStatics.markdown).length - 1).toBe(1);
    });

    it('VALID: template => serves unitMarkingStatics exactly once', () => {
      expect(TEMPLATE.split(unitMarkingStatics.markdown).length - 1).toBe(1);
    });

    it('VALID: template => serves observableAutomatabilityStatics exactly once', () => {
      expect(TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1).toBe(1);
    });

    it('VALID: template => serves sadPathRoutingStatics exactly once', () => {
      expect(TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1).toBe(1);
    });
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE FIXER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN marking step
  // where the flag applies — right beside the `cant-meet` mark it exists to replace.
  it('VALID: template => tells the fixer to flag verifyByHuman on an observable instead of forcing a fix or marking cant-meet', () => {
    expect(
      has(
        '**Where the unit you were minted to fix resists every fix you can make, and nothing at any ' +
          'layer could ever settle it either — not a later fixer, not a later session, nothing but a ' +
          "person's own judgment once the quest is done: on an OBSERVABLE, set `verifyByHuman: true` " +
          'on it through `modify-quest` instead of forcing a fix or marking `cant-meet`.',
      ),
    ).toBe(true);
  });

  // A TERMINAL OR BRANCH UNIT CARRIES NO verifyByHuman FIELD. This fixer inherits whatever kind of
  // unit the happy walker minted it on — an observable, a terminal node, or a labelled branch edge —
  // so the honest mark for the latter two has to be spelled out rather than left to a blanket "flag
  // it" that names no field on a unit that has none.
  it("VALID: template => tells the fixer a terminal or branch unit takes cant-meet with a toSettle naming the person's check instead", () => {
    expect(
      has(
        'On a terminal or branch unit, which ' +
          "carries no such field, `cant-meet` is the honest mark — name the person's check as its " +
          '`toSettle`.',
      ),
    ).toBe(true);
  });

  // THE OLD "toSettle NOTHING COULD CARRY OUT" CLAIM IS GONE. A person's check IS an instruction a
  // toSettle can carry — that is exactly what unitMarkingStatics defines toSettle to be.
  it('VALID: template => never claims a toSettle is something nothing could ever carry out', () => {
    expect({
      oldClaimGone: has('rather than a `toSettle` nothing could ever carry out'),
    }).toStrictEqual({ oldClaimGone: false });
  });

  // DISCOVERABILITY: the docs tool's own overview exists and is one flag away — every prompt that
  // reaches for `docs --for <scope>` says so, beside that same instruction.
  it('VALID: template => tells the reader that bare docs, with no --for, serves the tool overview', () => {
    expect(
      has(
        'run `dungeonmaster siegelense docs --for fixing` — bare `dungeonmaster siegelense docs`, ' +
          "with no `--for`, serves the tool's own overview instead.",
      ),
    ).toBe(true);
  });

  it('VALID: template => holds these ### steps, in this order, and no others', () => {
    const stepHeadings = Array.from(TEMPLATE.matchAll(/^### .+$/gmu), (match) => match[0]);

    expect(stepHeadings).toStrictEqual([
      '### 1. Fetch your brief',
      '### 2. Load standards, then find your way',
      '### 3. Choose the layer by what the defect is, then watch it fail — RED FIRST',
      '### 4. When your regression needs seeded state, use the SAME recipes the walk used',
      '### 5. Fix the CAUSE — six shapes you may not reach for',
      '### 6. Never weaken, skip or delete a test to reach green',
      '### 7. Evidence beats the brief — and say so on the record',
      '### 8. Mark each unit as it settles',
      '### 9. Where the fix moved behaviour nobody can enumerate, invalidate the flow',
      '### 10. Ward your own paths, and nothing wider',
      '### 11. Signal — there is no forward route back to you',
    ]);
  });

  // The step this brief flags as the one 25k inverts. Pinned VERBATIM so a future edit to either
  // prompt is caught here first, rather than the two silently drifting apart.
  it('VALID: template => states the layer-choice rule this exact way', () => {
    expect(
      has(
        '**Choose the layer by what the defect IS, never by what is convenient to write.** Painted ' +
          'geometry — a wrong pixel position, a missing visual state, anything only a real layout ' +
          'engine renders — goes to an e2e, because jsdom has no layout engine and nothing below ' +
          "Playwright can see it. A boundary between two parts — a broker's contract with an " +
          "adapter, a responder's contract with a broker — goes to an integration test. Pure logic " +
          "— a transformer, a guard, a contract's own rule — goes to a unit test.",
      ),
    ).toBe(true);
  });

  describe('the six symptom-hiding shapes', () => {
    it('VALID: template => names all six by name, individually', () => {
      expect({
        widenType: has('widen a type to accept the bad value'),
        swallowError: has('swallow the error'),
        defaultMissing: has('default the missing value'),
        raiseTimeout: has('raise the timeout'),
        loosenAssertion: has('loosen an assertion'),
        deleteBranch: has('delete the branch'),
      }).toStrictEqual({
        widenType: true,
        swallowError: true,
        defaultMissing: true,
        raiseTimeout: true,
        loosenAssertion: true,
        deleteBranch: true,
      });
    });
  });

  describe('the recipe rule', () => {
    it('VALID: template => tells the fixer to seed its regression from the SAME recipe the walk used', () => {
      expect({
        useSameRecipe: has(
          "Use that same recipe, by that same name, to seed your regression test's starting state.",
        ),
        neverReDerive: has('Never re-derive the setup by hand.'),
        namesRecipesList: has("`get-quest-work`'s `recipes` list names"),
        writeApiSameTargets: has(
          "an ingredient's `write` route runs that plan against the filesystem directly and its " +
            "`api` route runs the identical plan through the app's own live endpoints",
        ),
        missingRecipeIsNotYoursToInvent: has(
          'A recipe missing from that list, or carrying no `provenRunId`, is not yours to invent.',
        ),
      }).toStrictEqual({
        useSameRecipe: true,
        neverReDerive: true,
        namesRecipesList: true,
        writeApiSameTargets: true,
        missingRecipeIsNotYoursToInvent: true,
      });
    });
  });

  describe('touching a lane is forbidden outright', () => {
    it('VALID: template => forbids starting, stopping, restarting or driving any lane', () => {
      expect({
        tag: has('[NO LANE OF YOUR OWN]'),
        theFourVerbs: has(
          'You start no lane, stop no lane, restart no lane, and drive no lane — ever.',
        ),
        notYoursToReproduceFirst: has(
          'A fixer holding its own instance first, "to reproduce it before fixing it," is not being ' +
            'thorough',
        ),
        capacityNothingBudgeted: has('spending a capacity slot nothing budgeted for you'),
      }).toStrictEqual({
        tag: true,
        theFourVerbs: true,
        notYoursToReproduceFirst: true,
        capacityNothingBudgeted: true,
      });
    });

    // The rule this brief carries FORWARD names re-running the setup on a fresh instance in order to
    // FORBID it — that is not the same as the rule this brief drops, which capped concurrent fixers
    // over a disjoint file set. Neither phrase survives here.
    it('EMPTY: template => never states the dropped two-fixer-cap rule', () => {
      expect({
        capTwoFixers: has('cap two fixers'),
        disjointFileSet: has('disjoint file set'),
      }).toStrictEqual({
        capTwoFixers: false,
        disjointFileSet: false,
      });
    });
  });

  describe('there is no forward `done` route', () => {
    it('VALID: template => says its own done returns to the walker that minted it, never forward', () => {
      expect({
        noForwardRouteHeading: has('### 11. Signal — there is no forward route back to you'),
        doneCarriesNoForwardRoute: has(
          'Your `done` carries no forward route: it returns to the very walker that minted you',
        ),
        undeclaredOutcomeReturnsToWalker: has(
          'the undeclared outcome sends your `done` back to the walker that minted you',
        ),
        unmetMintsFreshFixerNotWalker: has(
          'Leave a unit `unmet` and the SAME route mints a fresh `siege-happy-fixer` on exactly ' +
            'what is left — never the walker, until every assigned unit is settled.',
        ),
      }).toStrictEqual({
        noForwardRouteHeading: true,
        doneCarriesNoForwardRoute: true,
        undeclaredOutcomeReturnsToWalker: true,
        unmetMintsFreshFixerNotWalker: true,
      });
    });
  });

  it('VALID: template => never runs git, and never commits', () => {
    expect({
      noGitTag: has('[NO GIT] You run no git command, ever — not even to read.'),
      commitsNothing: has(
        'You commit nothing either. No session on this pass does; a deterministic `commit` step ' +
          'further down the ledger takes the whole tree.',
      ),
    }).toStrictEqual({
      noGitTag: true,
      commitsNothing: true,
    });
  });

  // ITS ADVERSARIAL TWIN CARRIES A YOURS / NOT YOURS TABLE; THIS PROMPT DID NOT. A mark is written
  // through quest-work (its `observations` payload), never modify-quest — modify-quest is a spec
  // edit, granted here for exactly one field, verifyByHuman. Pinned the same way the twin's table is.
  it('VALID: tool table => quest-work carries the marks, modify-quest carries only verifyByHuman', () => {
    expect({
      hasYours: has('YOURS'),
      hasNotYours: has('NOT YOURS'),
      questWorkCarriesMarks: has(
        'quest-work                                  observations (your marks), request, amendment, outcome',
      ),
      modifyQuestCarriesVerifyByHumanOnly: has(
        'modify-quest                                step 8, verifyByHuman only, on a unit nothing could ever settle',
      ),
      notYoursExcludesEveryOtherField: has('modify-quest on any field but verifyByHuman'),
      neverClaimsModifyQuestIsMarks: !has('modify-quest                                your marks'),
    }).toStrictEqual({
      hasYours: true,
      hasNotYours: true,
      questWorkCarriesMarks: true,
      modifyQuestCarriesVerifyByHumanOnly: true,
      notYoursExcludesEveryOtherField: true,
      neverClaimsModifyQuestIsMarks: true,
    });
  });

  it('VALID: template => runs no ward but its own, scoped, never uncommitted or bare or run-ward', () => {
    expect({
      scopedOnce: has(
        '[WARD SCOPE] You run ward exactly once, scoped to your own paths, in the foreground',
      ),
      neverUncommitted: has('Never `--uncommitted`.'),
      neverBare: has('Never a bare `npm run ward`.'),
      neverRunWardTool: has('Never the `run-ward` MCP tool'),
    }).toStrictEqual({
      scopedOnce: true,
      neverUncommitted: true,
      neverBare: true,
      neverRunWardTool: true,
    });
  });
});
