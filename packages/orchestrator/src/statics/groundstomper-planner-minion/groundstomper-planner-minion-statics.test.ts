import { plannerInformationStatics } from '../planner-information/planner-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { groundstomperPlannerMinionStatics } from './groundstomper-planner-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = groundstomperPlannerMinionStatics.prompt.template;

describe('groundstomperPlannerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the plan's blocks or the return block — so a session that skips the
  // call has no method at all. Pinned as the FIRST numbered step rather than as "somewhere in the
  // file", because anywhere else in the file is exactly the failure.
  it('VALID: served template => makes the get-planner-information call step 1 of the workflow', () => {
    // `## Workflow` is quoted inline earlier in the prompt ("...through `## Workflow`**"), so the
    // anchor matches the heading's own em dash to land on the real heading rather than that mention.
    const workflow = TEMPLATE.slice(TEMPLATE.indexOf('\n## Workflow —') + 1);

    expect(
      workflow.startsWith('## Workflow — six stages, each adding one layer to the document'),
    ).toBe(true);
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
  // returns can name a browser walk, a Playwright config or an e2e-eligible package. Each needle below
  // is this discipline's alone, and moving one up into the shared payload would make it wrong for the
  // other four.
  it('VALID: served template => keeps every rule that is browser-walk planning`s alone', () => {
    expect({
      neverCutJest: hasIn({ needle: '**A chunk whose artifact is a Jest test.**', text: TEMPLATE }),
      neverEditPlaywrightConfig: hasIn({
        needle: '**A chunk that edits the Playwright config.**',
        text: TEMPLATE,
      }),
      gradedOverWholeFlow: hasIn({
        needle: '## You are graded over the WHOLE flow, below-browser units included',
        text: TEMPLATE,
      }),
      whereASpecLives: hasIn({ needle: '## Where a spec lives', text: TEMPLATE }),
      mineTheHarnesses: hasIn({
        needle: '## Mine the existing harnesses for ways to FORCE A FAULT, not for fixtures',
        text: TEMPLATE,
      }),
      spikesAreThrowaways: hasIn({
        needle: '## Spikes are THROWAWAYS on this round, not kept',
        text: TEMPLATE,
      }),
      explorerBrief: hasIn({ needle: '## The explorer brief', text: TEMPLATE }),
      checkerBrief: hasIn({ needle: '## The checker brief', text: TEMPLATE }),
    }).toStrictEqual({
      neverCutJest: true,
      neverEditPlaywrightConfig: true,
      gradedOverWholeFlow: true,
      whereASpecLives: true,
      mineTheHarnesses: true,
      spikesAreThrowaways: true,
      explorerBrief: true,
      checkerBrief: true,
    });
  });
});
