import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { siegePlannerStatics } from './siege-planner-statics';

const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = siegePlannerStatics.prompt.template;

const ARGUMENTS = siegePlannerStatics.prompt.placeholders.arguments;

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('siegePlannerStatics', () => {
  it('VALID: exported template => is a non-empty string', () => {
    expect(TEMPLATE).toMatch(/^.+$/su);
  });

  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, last, under its own heading', () => {
    expect({
      placeholder: ARGUMENTS,
      count: TEMPLATE.split(ARGUMENTS).length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith(ARGUMENTS),
      underItsOwnHeading: hasIn({ needle: `## Operation Context\n\n${ARGUMENTS}` }),
    }).toStrictEqual({
      placeholder: '$ARGUMENTS',
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
    });
  });

  it('VALID: served template => names its eight top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Your tools',
      '## The script',
      '## Writing a piece',
      '## The sad paths, and where each lands',
      '## How you finish',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its thirteen script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your work item',
      '### 2. Read your flow, and the kind of scope you hold',
      '### 3. Take the walk paths as given',
      '### 4. Paths are the itinerary. Units are the coverage.',
      '### 5. Order the paths cheapest first',
      '### 6. Cut one `happyWalk` piece per path',
      '### 7. Allocate the seven off-map probe families',
      '### 8. Cut one `adversarial` piece per allocated family, and none past the seventh',
      '### 9. A batch holds pieces for ONE step',
      "### 10. `hostile-input` and `perf` are this quest's only security and performance coverage",
      '### 11. Mark every family that gets no piece',
      '### 12. Request what the walks cannot start without',
      '### 13. Write the plan, read it back, declare and signal',
    ]);
  });

  // A PIECE'S HUMAN NAME IS DISTINCT FROM ITS `id`. The router carries `pieceName` onto the minted
  // work item's payload, and the execution panel reads it to label a step's rows — a piece skeleton
  // missing the field is a plan every downstream reader can only label by its bare id.
  it('VALID: served template => requires pieceName on a piece, distinct from id', () => {
    expect({
      fieldInSkeleton: hasIn({
        needle: "pieceName: '<a short human name — the path's own subject",
      }),
      requiredAndDistinctFromId: hasIn({
        needle:
          '**`pieceName` is required, and it is not `id`.** `id` is your own cross-reference mnemonic;',
      }),
    }).toStrictEqual({ fieldInSkeleton: true, requiredAndDistinctFromId: true });
  });

  it('VALID: served template => interpolates sad-path and spilled shared blocks, and takes no marking block', () => {
    expect({
      sadPaths: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      marking: TEMPLATE.includes(unitMarkingStatics.markdown),
      markingHeading: TEMPLATE.includes('## Marking your units'),
    }).toStrictEqual({
      sadPaths: 1,
      spilled: 1,
      marking: false,
      markingHeading: false,
    });
  });

  it('VALID: served template => places the spill rule beside get-quest, not get-quest-work', () => {
    expect({
      fallbackCall: hasIn({
        needle: "get-quest({ questId: 'QUEST_ID', flowId: '<scope.flowId>' })",
      }),
      spillSitsAfterFallback:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest({ questId: 'QUEST_ID', flowId: '<scope.flowId>' })"),
      spillSitsAfterGetQuestWork:
        TEMPLATE.indexOf(spilledToolResultStatics.markdown) >
        TEMPLATE.indexOf("get-quest-work({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID' })"),
    }).toStrictEqual({
      fallbackCall: true,
      spillSitsAfterFallback: true,
      spillSitsAfterGetQuestWork: true,
    });
  });

  it('VALID: served template => marks cant-meet as its only plannerMarks authority', () => {
    expect({
      plannerMarksAuthority: hasIn({
        needle:
          '**Your one mark authority is `plannerMarks`, and `cant-meet` is the only mark it takes**',
      }),
      cantMeetNeedsAToSettle: hasIn({
        needle:
          '`plannerMarks` takes `cant-meet` and nothing else, on a unit no piece of yours claims',
      }),
    }).toStrictEqual({
      plannerMarksAuthority: true,
      cantMeetNeedsAToSettle: true,
    });
  });

  it('VALID: served template => dispatches no worker and writes no file', () => {
    expect({
      routerDispatches: hasIn({
        needle: '**You cut pieces. You run none of them.**',
      }),
      noFile: hasIn({
        needle: '**You write no file at all.** Your plan is a tool call, not a document on disk.',
      }),
      noLedgerEdit: hasIn({
        needle:
          '**You never edit the operations ledger.** You declare an outcome at the end and the router applies it.',
      }),
      subagentType: TEMPLATE.includes('subagent_type'),
      pass2: TEMPLATE.includes('Pass 2'),
      redTests: TEMPLATE.includes('RED TESTS'),
    }).toStrictEqual({
      routerDispatches: true,
      noFile: true,
      noLedgerEdit: true,
      subagentType: false,
      pass2: false,
      redTests: false,
    });
  });
});
