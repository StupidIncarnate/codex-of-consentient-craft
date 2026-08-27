import { plannerInformationStatics } from '../planner-information/planner-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { siegemasterPlannerMinionStatics } from './siegemaster-planner-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterPlannerMinionStatics.prompt.template;

describe('siegemasterPlannerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the plan's blocks or the return block — so a session that skips the
  // call has no method at all. Pinned as the FIRST numbered step rather than as "somewhere in the
  // file", because anywhere else in the file is exactly the failure.
  it('VALID: served template => makes the get-planner-information call step 1 of the workflow', () => {
    // The opening paragraph names `## Workflow` in backticks as a pointer, before the real heading, so
    // the slice anchors to a line start — a heading always follows a newline and that mention never
    // does.
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow'));

    expect(
      hasIn({
        needle:
          '1. **Call `get-planner-information`, and read what it returns before you open anything.**',
        text: workflow.slice(0, workflow.indexOf('2. **')),
      }),
    ).toBe(true);
  });

  // The prompt does not re-list what the tool returns. Step 1 already says it, and a second copy is
  // the duplication this whole split exists to end — so it is pinned ABSENT rather than left to review.
  it('VALID: served template => never restates what the planner tool returns', () => {
    expect(hasIn({ needle: 'That is everything true of every planner', text: TEMPLATE })).toBe(
      false,
    );
  });

  // The server substitutes exactly one operation context, at the end. More than one landing site would
  // put the same block in twice; none would drop the quest id the round document is checked against.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
    }).toStrictEqual({ count: 1, atTheEnd: true });
  });

  // WHAT MOVED MUST NOT COME BACK. Every needle below is served by `get-planner-information` now, and a
  // copy here would be paid for twice — once in this prompt's budget, once in drift from the copy the
  // other four planners read. Pinned as ABSENT rather than left to review.
  it('VALID: served template => restates no block the planner information tool serves', () => {
    expect({
      document: hasIn({ needle: roundProtocolStatics.document, text: TEMPLATE }),
      briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: TEMPLATE }),
      planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: TEMPLATE }),
      chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: TEMPLATE }),
      indexes: hasIn({ needle: roundProtocolStatics.indexes, text: TEMPLATE }),
      commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: TEMPLATE }),
      nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: TEMPLATE }),
      operatingRules: hasIn({
        needle: '**[TURN END] Never call `signal-back`. Your final message is how you finish.**',
        text: TEMPLATE,
      }),
      wholeInformationPayload: hasIn({
        needle: plannerInformationStatics.markdown,
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      document: false,
      briefKeys: false,
      planBlocks: false,
      chunkFields: false,
      indexes: false,
      commitSubjects: false,
      nextLine: false,
      operatingRules: false,
      wholeInformationPayload: false,
    });
  });

  // WHAT STAYED IS WHAT ANOTHER PLANNER WOULD READ AS FALSE. The tool takes no argument, so nothing it
  // returns can name a walk path, a dev server or a reset lever. Each needle below is this discipline's
  // alone, and moving one up into the shared payload would make it wrong for the other four.
  it('VALID: served template => keeps every rule that is manual-QA planning`s alone', () => {
    expect({
      noFileIsAuthored: hasIn({
        needle:
          'Nothing on this round is authored: no chunk writes a file, no entry is a path, and no unit is proved in one.',
        text: TEMPLATE,
      }),
      everyChunkOwnWaveSerial: hasIn({
        needle: 'EVERY CHUNK GOES IN ITS OWN WAVE. This work is strictly SERIAL.',
        text: TEMPLATE,
      }),
      devServerBan: hasIn({
        needle:
          '**Starting, restarting or stopping the dev server, yourself or through a helper you send.**',
        text: TEMPLATE,
      }),
      resetClearsSignoffs: hasIn({
        needle: "that reset clears this whole flow's sign-offs",
        text: TEMPLATE,
      }),
      noExtraWall: hasIn({ needle: '## This round declares no extra `wall`', text: TEMPLATE }),
      unitProvedNotFile: hasIn({
        needle: '## Where a unit gets proved — NOT a file',
        text: TEMPLATE,
      }),
      explorerBrief: hasIn({ needle: '## The explorer brief', text: TEMPLATE }),
      checkerBrief: hasIn({ needle: '## The checker brief', text: TEMPLATE }),
    }).toStrictEqual({
      noFileIsAuthored: true,
      everyChunkOwnWaveSerial: true,
      devServerBan: true,
      resetClearsSignoffs: true,
      noExtraWall: true,
      unitProvedNotFile: true,
      explorerBrief: true,
      checkerBrief: true,
    });
  });
});
