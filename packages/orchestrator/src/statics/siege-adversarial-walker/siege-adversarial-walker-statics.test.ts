import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

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
