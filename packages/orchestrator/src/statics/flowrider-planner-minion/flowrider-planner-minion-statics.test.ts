import { plannerInformationStatics } from '../planner-information/planner-information-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { flowriderPlannerMinionStatics } from './flowrider-planner-minion-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderPlannerMinionStatics.prompt.template;

describe('flowriderPlannerMinionStatics', () => {
  // THE TOOL CALL IS STEP 1 OF THE WORKFLOW, not prose above it. A session executes the numbered
  // procedure; an instruction floating over the top of it gets skimmed, and this prompt no longer
  // carries the operating rules, the plan's blocks or the return block — so a session that skips the
  // call has no method at all.
  it('VALID: served template => makes the get-planner-information call step 1 of the workflow', () => {
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

  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
    }).toStrictEqual({ count: 1, atTheEnd: true });
  });

  // WHAT MOVED MUST NOT COME BACK. Carrying these is what put this template over the MCP verbatim
  // ceiling, which spilled it to a file and handed the planner an error stub instead of its method.
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

  // A ROLE IS NAMED BY ITS INSTRUMENT, NEVER BY SUBTRACTING A SIBLING'S. "Below the browser" names no
  // artifact, no tool, no package and no file suffix, so a planner that does not already know what
  // flowrider produces cannot derive it — a real reader read all four flowrider prompts and could not
  // say. Four things make the answer derivable, and each fails on its own: the section heading a
  // reader looks for, the artifact by file suffix, the packages by kind, and the three-role table
  // that says which claims are somebody else's.
  it('VALID: served template => names the artifact, the packages and the sibling roles before the workflow', () => {
    const beforeTheWorkflow = TEMPLATE.slice(0, TEMPLATE.indexOf('\n## Workflow'));

    expect({
      itsOwnHeading: hasIn({
        needle: '## What flowrider does, so you know what you are planning',
        text: beforeTheWorkflow,
      }),
      namesThePackages: hasIn({
        needle: "**Flowrider's packages are the ones nobody can point a browser at**",
        text: beforeTheWorkflow,
      }),
      splitsTheThreeRoles: hasIn({
        needle: '| The role | How it proves a unit | Which units are its own |',
        text: beforeTheWorkflow,
      }),
      definesItselfBySubtraction: hasIn({ needle: 'below the browser', text: TEMPLATE }),
    }).toStrictEqual({
      itsOwnHeading: true,
      namesThePackages: true,
      splitsTheThreeRoles: true,
      definesItselfBySubtraction: false,
    });
  });

  // THE CODEWEAVER BOUNDARY IS THE QUESTION THIS PROMPT COULD NOT ANSWER. Codeweaver writes the
  // `.integration.test.ts` beside every `flows/` and `startup/` file it builds, so "flowrider writes
  // integration tests" names no boundary at all — a planner reading only that cuts chunks that stand a
  // second suite beside the one already there, which is the sibling role's work undone. Four things
  // separate them and each fails on its own: the section, that Codeweaver proved ONE SEAM, that this
  // round covers the WHOLE PATH, and that these units come from a call Codeweaver never makes.
  it('VALID: served template => draws the boundary against the implementation round that ran before it', () => {
    const beforeTheWorkflow = TEMPLATE.slice(0, TEMPLATE.indexOf('\n## Workflow'));

    expect({
      itsOwnHeading: hasIn({
        needle: '## What Codeweaver already built, and what is left for this round',
        text: beforeTheWorkflow,
      }),
      codeweaverProvedTheSeam: hasIn({
        needle:
          'Where one of its chunks wired two pieces together, that chunk proved THAT SEAM.',
        text: beforeTheWorkflow,
      }),
      thisRoundCoversTheWholePath: hasIn({
        needle:
          'the WHOLE PATH: every route to every end node, every labelled branch, the error ones included',
        text: beforeTheWorkflow,
      }),
      theDenominatorsDiffer: hasIn({
        needle: 'the `[ ]` units of `get-qa-checklist`, which no Codeweaver session ever calls',
        text: beforeTheWorkflow,
      }),
      namesTheOneOutputKind: hasIn({
        needle:
          'cases added to those `.integration.test.ts` files, and the harnesses they drive through. Nothing else',
        text: beforeTheWorkflow,
      }),
      extendRatherThanCreate: hasIn({
        needle: '**So a chunk here EXTENDS a test file far more often than it creates one**',
        text: beforeTheWorkflow,
      }),
      onlyNewFileIsAHarness: hasIn({
        needle: '**The only NEW file a chunk here usually cuts is a harness under `test/`.**',
        text: beforeTheWorkflow,
      }),
    }).toStrictEqual({
      itsOwnHeading: true,
      codeweaverProvedTheSeam: true,
      thisRoundCoversTheWholePath: true,
      theDenominatorsDiffer: true,
      namesTheOneOutputKind: true,
      extendRatherThanCreate: true,
      onlyNewFileIsAHarness: true,
    });
  });

  // THIS ROUND WRITES ONE KIND OF FILE, AND THE MOCK BOUNDARY IS NOT THE UNIT-TEST ONE. Both halves
  // are repo standards rather than preferences: `flows/` and `startup/` are the only folder types
  // carrying `testType: 'integration'`, so beside one of them a `.test.ts` or a `.proxy.ts` is a lint
  // error its worker cannot ward past; and this repo's mock-boundary rule names its own file system,
  // its own endpoints, its own brokers and its own adapters as INVALID mocks, leaving only services
  // outside the repo. A planner holding the unit-test boundary instead cuts chunks whose tests prove
  // a mock. Five needles, each failing on its own.
  it('VALID: served template => writes only integration tests, and mocks only what sits outside this repo', () => {
    expect({
      itsOwnHeading: hasIn({
        needle:
          '## Every file this round writes is an `.integration.test.ts`, and there is no second kind',
        text: TEMPLATE,
      }),
      oneFileTypeOnly: hasIn({
        needle:
          '**`.integration.test.ts` is the ONLY test file a chunk here cuts.** No `.test.ts`, no `.proxy.ts`, no `.e2e.ts`.',
        text: TEMPLATE,
      }),
      pairsWithOneImplementation: hasIn({
        needle:
          '**One of these files sits beside the ONE implementation file whose entry point it drives**',
        text: TEMPLATE,
      }),
      everythingOursRunsReal: hasIn({
        needle: '**Everything this repo owns runs REAL in one of these tests.**',
        text: TEMPLATE,
      }),
      mocksOnlyOutsideServices: hasIn({
        needle:
          '**Never the file system. Never a local endpoint of ours. Never a database call. Never one of our brokers, adapters, responders or transformers.**',
        text: TEMPLATE,
      }),
      harnessNotProxy: hasIn({
        needle: '**Infrastructure reaches the test through a HARNESS, never a proxy.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      itsOwnHeading: true,
      oneFileTypeOnly: true,
      pairsWithOneImplementation: true,
      everythingOursRunsReal: true,
      mocksOnlyOutsideServices: true,
      harnessNotProxy: true,
    });
  });

  // THE SCOPE AND THE FINISH LINE ARE THE OTHER HALF OF "WHAT YOU ARE PLANNING FOR". Naming the
  // artifact still leaves a planner guessing which units it owes and when the round is done, and both
  // answers are one tool call and one rule — so both sit above the workflow rather than inside it.
  it('VALID: served template => names the scope call and the finish line before the workflow', () => {
    const beforeTheWorkflow = TEMPLATE.slice(0, TEMPLATE.indexOf('\n## Workflow'));

    expect({
      itsOwnHeading: hasIn({
        needle: '## What your plan is measured against',
        text: beforeTheWorkflow,
      }),
      namesTheCall: hasIn({
        needle: '`get-qa-checklist({ questId, operationItemId })`',
        text: beforeTheWorkflow,
      }),
      namesTheFinishLine: hasIn({
        needle:
          'The round is done when every one of them is either covered by a chunk you cut or explained by a line in `NO CHUNK`.',
        text: beforeTheWorkflow,
      }),
    }).toStrictEqual({ itsOwnHeading: true, namesTheCall: true, namesTheFinishLine: true });
  });

  // WHAT STAYED IS WHAT ANOTHER PLANNER WOULD READ AS FALSE. The checklist marks, the slice/seam
  // routing rule and the four layers all describe a denominator no other discipline is graded against.
  it('VALID: served template => keeps every rule that planning Jest coverage is alone in needing', () => {
    expect({
      threeMarks: hasIn({
        needle: '## The checklist has three marks, and only one of them is yours',
        text: TEMPLATE,
      }),
      cutFromOpenBoxesOnly: hasIn({
        needle: '**Cut chunks from the `[ ]` units ONLY.**',
        text: TEMPLATE,
      }),
      sliceVersusSeam: hasIn({
        needle:
          '**A package slice does NOT own the seams. The seam slice does NOT own the per-package units.**',
        text: TEMPLATE,
      }),
      fourLayers: hasIn({
        needle: '| The layer | What the assertion reads, after the test drives the flow |',
        text: TEMPLATE,
      }),
      routeOnSurface: hasIn({
        needle: '**Route on the SURFACE a claim needs, never on its observable `type`.**',
        text: TEMPLATE,
      }),
      // ONE CHUNK PER INTEGRATION TEST FILE, because a flow does not map to a file: one quest flow
      // crosses several entry points and each has its own test beside its own implementation. Cutting
      // by flow gives a chunk four files and lets two chunks collide on one; cutting by file makes
      // `FILES` disjointness hold by construction.
      oneChunkPerFile: hasIn({
        needle: '## ONE CHUNK PER INTEGRATION TEST FILE',
        text: TEMPLATE,
      }),
      notAFlowNotABundle: hasIn({
        needle:
          '**A chunk is one integration test file and the units that land on it.** Not a flow, not a bundle of flows, not a package.',
        text: TEMPLATE,
      }),
      // A `flows/`/`startup/` FOLDER holds one test per entry point — nine in one measured folder here
      // — so a planner assuming "the" integration test inventories one file and drops the rest.
      folderHoldsManyTests: hasIn({
        needle:
          '**A `flows/` or `startup/` FOLDER therefore holds as many of them as it holds entry points, not one.**',
        text: TEMPLATE,
      }),
      dolesUnitsOutInTouches: hasIn({
        needle:
          '**Then put every `[ ]` unit under exactly one entry, by asking which entry point reaches that claim.**',
        text: TEMPLATE,
      }),
      harnessForcesAWave: hasIn({
        needle: '**TWO things force a later wave, and nothing else does**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      threeMarks: true,
      cutFromOpenBoxesOnly: true,
      sliceVersusSeam: true,
      fourLayers: true,
      routeOnSurface: true,
      oneChunkPerFile: true,
      notAFlowNotABundle: true,
      folderHoldsManyTests: true,
      dolesUnitsOutInTouches: true,
      harnessForcesAWave: true,
    });
  });

  // THIS DISCIPLINE WIDENS NOTHING, and saying so is not the same as saying nothing. The codeweaver
  // planner declares one extra wall; a reader coming from that prompt would otherwise carry the
  // exception across, so this one states the absence under its own heading.
  it('VALID: served template => states that it adds no wall of its own', () => {
    expect({
      itsOwnHeading: hasIn({ needle: '## This round declares no wall of its own', text: TEMPLATE }),
      neverWidens: hasIn({
        needle:
          '**Nothing about writing Jest tests widens that list, and you never widen it yourself.**',
        text: TEMPLATE,
      }),
      emptyChecklistIsAPlan: hasIn({
        needle: '**An EMPTY checklist is a real state, not an error.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ itsOwnHeading: true, neverWidens: true, emptyChecklistIsAPlan: true });
  });
});
