import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { siegemasterReaderStatics } from './siegemaster-reader-statics';

const TEMPLATE = siegemasterReaderStatics.prompt.template;

describe('siegemasterReaderStatics', () => {
  it('VALID: exported value => has exactly one key, a template string', () => {
    expect(siegemasterReaderStatics).toStrictEqual({
      prompt: { template: expect.stringMatching(/^.+$/su) },
    });
  });

  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub. This template has no interpolation left to resolve, so the served text IS this literal.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // `workItemToPromptTransformer` replaces the literal token with the four ids it substitutes. A
  // second slot would split that context in two, and a slot that is not last buries it under
  // instructions already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: TEMPLATE.includes('## Operation Context\n\n$ARGUMENTS'),
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
    });
  });

  // `get-quest-work` is truncated by `questWorkTruncateTransformer`, never spilled — so the rule
  // belongs beside step 2's `discover` call, which carries no such transformer, not beside step 1.
  it('VALID: served template => interpolates the spilled-result rule exactly once, beside opening the source', () => {
    const block = spilledToolResultStatics.markdown;
    const stepTwoIndex = TEMPLATE.indexOf('### 2. Open the source');
    const blockIndex = TEMPLATE.indexOf(block);
    const stepThreeIndex = TEMPLATE.indexOf(
      '### 3. Return a location or a configured value — never a verdict',
    );

    expect({
      occurrences: TEMPLATE.split(block).length - 1,
      stepTwoBeforeBlock: stepTwoIndex < blockIndex,
      blockBeforeStepThree: blockIndex < stepThreeIndex,
    }).toStrictEqual({
      occurrences: 1,
      stepTwoBeforeBlock: true,
      blockBeforeStepThree: true,
    });
  });

  // This step holds no units and declares no route beyond its own outcome, so a marking discipline
  // or a sad-path table would teach it a rule it never exercises.
  it('EMPTY: served template => carries neither the unit-marking nor the sad-path-routing block', () => {
    expect({
      marking: TEMPLATE.indexOf(unitMarkingStatics.markdown),
      sadPath: TEMPLATE.indexOf(sadPathRoutingStatics.markdown),
    }).toStrictEqual({
      marking: -1,
      sadPath: -1,
    });
  });

  it('VALID: served template => returns a location or a configured value, never an expected value the unit should carry', () => {
    const needle =
      '"The cap is 50" is a configuration. "The list should show 50 rows" is a verdict, and handing a\nwalker a verdict launders it through one more session';
    const found = TEMPLATE.slice(
      TEMPLATE.indexOf(needle),
      TEMPLATE.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: served template => requires file:line provenance on every returned value', () => {
    const needle =
      'A value with no provenance cannot be told from one a session remembered, and the walker citing it\ncannot check it without doing the reading you exist to prevent.';
    const found = TEMPLATE.slice(
      TEMPLATE.indexOf(needle),
      TEMPLATE.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: served template => routes a source-only expected value to a questNotes open question, not a returned value', () => {
    const needle =
      'That\nis not a value — it is a spec defect. Flag it in your return as an open question for a\n`questNotes` entry';
    const found = TEMPLATE.slice(
      TEMPLATE.indexOf(needle),
      TEMPLATE.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: served template => touches no instance and holds no lane', () => {
    const needle = 'You touch no instance and hold no lane slot.';
    const found = TEMPLATE.slice(
      TEMPLATE.indexOf(needle),
      TEMPLATE.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: served template => declares no forward route and returns to whoever asked', () => {
    const declares =
      '**You declare no forward route.** When you are finished you return to whoever asked.';
    const routes = 'You route nowhere. The work item you return to is the one that asked for you.';

    expect({
      declaresNone: TEMPLATE.slice(
        TEMPLATE.indexOf(declares),
        TEMPLATE.indexOf(declares) + declares.length,
      ),
      routesNowhere: TEMPLATE.slice(
        TEMPLATE.indexOf(routes),
        TEMPLATE.indexOf(routes) + routes.length,
      ),
    }).toStrictEqual({
      declaresNone: declares,
      routesNowhere: routes,
    });
  });

  it('VALID: served template => refuses Edit, Write and modify-quest as not its own', () => {
    const editWrite = 'Edit / Write                       you change nothing';
    const modifyQuest = 'modify-quest                       you write no quest content';

    expect({
      editWrite: TEMPLATE.slice(
        TEMPLATE.indexOf(editWrite),
        TEMPLATE.indexOf(editWrite) + editWrite.length,
      ),
      modifyQuest: TEMPLATE.slice(
        TEMPLATE.indexOf(modifyQuest),
        TEMPLATE.indexOf(modifyQuest) + modifyQuest.length,
      ),
    }).toStrictEqual({
      editWrite,
      modifyQuest,
    });
  });

  it('VALID: served template => runs on both the planner and the walker cadence', () => {
    const plannerCadence = 'requested by the PLANNER, before the first walk';
    const walkerCadence = 'requested by a WALKER, mid-pass';

    expect({
      plannerCadence: TEMPLATE.slice(
        TEMPLATE.indexOf(plannerCadence),
        TEMPLATE.indexOf(plannerCadence) + plannerCadence.length,
      ),
      walkerCadence: TEMPLATE.slice(
        TEMPLATE.indexOf(walkerCadence),
        TEMPLATE.indexOf(walkerCadence) + walkerCadence.length,
      ),
    }).toStrictEqual({
      plannerCadence,
      walkerCadence,
    });
  });
});
