import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';

import { siegeAdversarialWalkerStatics } from './siege-adversarial-walker-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// written on one line finds its sentence however the markdown happens to wrap. Anything measuring
// real bytes reads the template directly instead.
const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = siegeAdversarialWalkerStatics.prompt.template;

const ARGUMENTS = siegeAdversarialWalkerStatics.prompt.placeholders.arguments;

const SIGNAL_BACK_CALL =
  "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete' })";

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('siege-adversarial-walker-statics', () => {
  it('VALID: measures strictly below maxVerbatimChars', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, last, under its own heading', () => {
    expect({
      placeholder: ARGUMENTS,
      count: TEMPLATE.split(ARGUMENTS).length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith(ARGUMENTS),
      underItsOwnHeading: hasIn({ needle: `## Operation Context\n\n${ARGUMENTS}` }),
      noBareQuestIdHeading: TEMPLATE.includes('## The quest id'),
    }).toStrictEqual({
      placeholder: '$ARGUMENTS',
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      noBareQuestIdHeading: false,
    });
  });

  // THE BUG THIS GUARDS: a `kind: 'prompt'` step reaches a terminal state ONLY through
  // `signal-back`. A prompt telling the session it is a minion that "returns text" and "calls no
  // `signal-back`" leaves the real work item it is dispatched against open forever, until
  // `recover-orphaned-work-items-layer-broker` retries it into `slotManagerStatics.maxResets` and
  // the quest blocks. A name-list assertion (this step is registered as a real role, not a minion)
  // cannot catch that — the prompt TEXT is the only thing an agent session actually reads.
  it('VALID: served template => instructs exactly one signal-back call, called last', () => {
    expect({
      turnEndRule: hasIn({
        needle:
          '**[TURN END] Mark every unit, declare your outcome, then call `signal-back` once, last.**',
      }),
      signalBackCallCount: TEMPLATE.split(SIGNAL_BACK_CALL).length - 1,
      signalBackBeforeFooter:
        TEMPLATE.indexOf(SIGNAL_BACK_CALL) < TEMPLATE.indexOf('## Operation Context'),
      toolsListsSignalBackAsYours: hasIn({ needle: 'signal-back                    once, last' }),
      minionReturnsTextRule: TEMPLATE.includes('You return text. You call no `signal-back`.'),
      minionFramingInTools: TEMPLATE.includes('you are a minion; you return text'),
    }).toStrictEqual({
      turnEndRule: true,
      signalBackCallCount: 1,
      signalBackBeforeFooter: true,
      toolsListsSignalBackAsYours: true,
      minionReturnsTextRule: false,
      minionFramingInTools: false,
    });
  });

  // THE READING LADDER AND THE VERB LIST LIVE ONLY ON THE WALKING PAGE. This role drives attacks
  // against an instance, so it still needs the ladder and the verbs to do that driving — the
  // attacking page carries what is specific to an attack (health, reset levels, baselines) and
  // points here for the rest, rather than duplicating the walking page's own content.
  it('VALID: served template => reads the walking docs for the ladder and the verbs, and the attacking docs for health, reset and baselines', () => {
    expect({
      fetchesWalkingDocs: TEMPLATE.includes('dungeonmaster siegelense docs --for walking'),
      fetchesAttackingDocs: TEMPLATE.includes('dungeonmaster siegelense docs --for attacking'),
    }).toStrictEqual({
      fetchesWalkingDocs: true,
      fetchesAttackingDocs: true,
    });
  });

  // DISCOVERABILITY: the docs tool's own overview exists and is one flag away — every prompt that
  // reaches for `docs --for <scope>` says so, beside that same instruction.
  it('VALID: served template => tells the reader that bare docs, with no --for, serves the tool overview', () => {
    expect(
      hasIn({
        needle:
          "Bare `dungeonmaster siegelense docs`, with no `--for`, serves the tool's own overview instead of a role's manual.",
      }),
    ).toBe(true);
  });

  // THE SHARED BLOCK, WHOLE, EXACTLY ONCE. Restating it is text served twice against the same
  // budget; missing it is a rule this whole family agreed on that this prompt silently drops.
  it('VALID: served template => takes the observable-automatability block whole, exactly once', () => {
    expect(TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1).toBe(1);
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE WALKER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN workflow where
  // the flag applies — right beside the `cant-meet` mark and the N/A case it exists to replace.
  it('VALID: served template => tells the walker to flag verifyByHuman on its observable instead of cant-meet or N/A when a break could never settle', () => {
    expect(
      hasIn({
        needle:
          "**Where a break resists every attack you can mount, and nothing at any layer — not a later session, not a later round, nothing but a person's own judgment once the quest is done — could ever settle it either, flag it instead of marking `cant-meet` or writing it off as N/A: set `verifyByHuman: true` on its observable in the same `modify-quest` call above.**",
      }),
    ).toBe(true);
  });

  // THE FAMILY UNIT ITSELF CARRIES NO verifyByHuman FIELD. This walker's own scope is entirely
  // off-map (`stepScopeStatics.byFamilyStep.siegemaster.adversarial.unitKinds` is `['off-map']`), and
  // `flowObservableContract` is the only contract with the flag — so where the family unit, not a
  // per-break observable, is what resists settling, the honest mark is spelled out by name.
  it('VALID: served template => tells the walker the family unit carries no verifyByHuman field and takes cant-meet with a toSettle instead', () => {
    expect(
      hasIn({
        needle:
          "The family unit itself carries no such field — where the family unit, not a specific break, is what resists settling, `cant-meet` is the honest mark, with a `toSettle` naming the person's check.",
      }),
    ).toBe(true);
  });

  it('VALID: served template => declares an outcome and marks its family unit before it signals', () => {
    expect({
      outcomeCall: hasIn({
        needle:
          "payload: { kind: 'outcome', word: 'done', reason: '<what you drove, and what you found>' }",
      }),
      observationsCall: hasIn({
        needle:
          "payload: { kind: 'observations', observations: [\n  { unitId: '<unit id>', mark: 'met' | 'unmet', evidence:",
      }),
      outcomeBeforeSignal: TEMPLATE.indexOf("kind: 'outcome'") < TEMPLATE.indexOf(SIGNAL_BACK_CALL),
      observationsBeforeSignal:
        TEMPLATE.indexOf("kind: 'observations'") < TEMPLATE.indexOf(SIGNAL_BACK_CALL),
    }).toStrictEqual({
      outcomeCall: true,
      observationsCall: true,
      outcomeBeforeSignal: true,
      observationsBeforeSignal: true,
    });
  });
});
