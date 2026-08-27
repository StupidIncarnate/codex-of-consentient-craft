import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { plannerInformationStatics } from './planner-information-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so a needle written on one line finds its sentence however the markdown happens to wrap.
// Re-flowing a paragraph then reds nothing that is still true. The size assertion reads real bytes
// instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const MARKDOWN = plannerInformationStatics.markdown;

// `<dungeonmaster-ward-discipline>` is the NAME of a session snippet the [WARD] rule overrides by
// name, not this repo's word for a kind of work. Strip the citation before the check below, or the
// `discipline` needle matches the one place the word legitimately appears.
const WARD_DISCIPLINE_SNIPPET = /<dungeonmaster-ward-discipline>/gu;

const SEARCHABLE = MARKDOWN.toLowerCase().replace(WARD_DISCIPLINE_SNIPPET, '');

// `implementation` is deliberately NOT on this list, though it names one of the five kinds of work.
// It is also an ordinary English word this payload has to use — "touches no implementation file" —
// so a needle for it reports a defect on every honest sentence. `roundProtocolStatics`' own test
// omits it for the same reason. The four kebab-case ids below are unambiguous.
const DISCIPLINE_WORDS = [
  'discipline',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
] as const;

describe('plannerInformationStatics', () => {
  it('VALID: exported value => is exactly one markdown payload and nothing else', () => {
    expect(plannerInformationStatics).toStrictEqual({
      markdown: expect.stringMatching(/^# Planner information\n.+$/su),
    });
  });

  describe('what the MCP layer will do with it', () => {
    // `get-planner-information` serves this whole. Over `maxVerbatimChars` the MCP layer writes the
    // result to a file and hands the agent an error stub, so the planner starts its session holding a
    // path instead of its method. BYTES, not characters: the payload is full of em-dashes, which cost
    // three bytes each, and the size-cap test in `mcp-server-flow.integration.test.ts` measures the
    // same way.
    it('VALID: served payload => fits the MCP verbatim ceiling in bytes', () => {
      expect(Buffer.byteLength(MARKDOWN, 'utf8')).toBeLessThan(
        mcpToolResultStatics.maxVerbatimChars,
      );
    });

    // Nothing substitutes a tool result. A placeholder written here would reach the planner as the
    // literal token, and the server appends the operation context to the PROMPT instead — which is
    // why `## The quest id` stays in each of the five prompts and did not move here.
    it('VALID: served payload => carries no template placeholder', () => {
      expect({
        arguments: hasIn({ needle: '$ARGUMENTS', text: MARKDOWN }),
        discipline: hasIn({ needle: '$DISCIPLINE', text: MARKDOWN }),
        myDiscipline: hasIn({ needle: '$MY_DISCIPLINE', text: MARKDOWN }),
      }).toStrictEqual({ arguments: false, discipline: false, myDiscipline: false });
    });
  });

  // THE WHOLE REASON THE TOOL TAKES NO ARGUMENT. Five planner prompts read this one payload, and each
  // of those prompts is one discipline's subject matter. A sentence naming a role would be right in
  // one of the five and quietly wrong in the other four — the exact defect that splitting the generic
  // trio into per-role prompts was meant to end.
  it.each(agentPromptClassificationStatics.operatorRoleNames)(
    'VALID: served payload => never names the role %s',
    (role) => {
      expect(hasIn({ needle: role, text: SEARCHABLE })).toBe(false);
    },
  );

  it.each(DISCIPLINE_WORDS)('VALID: served payload => never names the discipline %s', (word) => {
    expect(hasIn({ needle: word, text: SEARCHABLE })).toBe(false);
  });

  describe('the blocks it carries, and the one it withholds', () => {
    // A planner reads the plan's blocks, the chunk fields and both indexes, and writes the plan and
    // one commit. Each block is pinned by identity rather than by a needle, so a block renamed or
    // re-flowed in `roundProtocolStatics` stays pinned here.
    it('VALID: served payload => embeds every protocol block a planner reads or writes', () => {
      expect({
        document: hasIn({ needle: roundProtocolStatics.document, text: MARKDOWN }),
        briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: MARKDOWN }),
        planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: MARKDOWN }),
        chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: MARKDOWN }),
        indexes: hasIn({ needle: roundProtocolStatics.indexes, text: MARKDOWN }),
        commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: MARKDOWN }),
        nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: MARKDOWN }),
      }).toStrictEqual({
        document: true,
        briefKeys: true,
        planBlocks: true,
        chunkFields: true,
        indexes: true,
        commitSubjects: true,
        nextLine: true,
      });
    });
  });

  describe('the rules a planner cannot be served without', () => {
    // A minion holding a `workItemId` that belongs to its PARENT could complete its parent's scope and
    // advance the relay mid-round. [TURN END] is the only thing standing between a planner and that
    // call, and it is the rule most easily lost when text moves between files.
    it('VALID: served payload => forbids `signal-back` and names the parent`s work item', () => {
      expect({
        neverSignal: hasIn({
          needle: '**[TURN END] Never call `signal-back`. Your final message is how you finish.**',
          text: MARKDOWN,
        }),
        workItemIsTheParents: hasIn({
          needle: 'The `workItemId` in your briefing belongs to your PARENT',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ neverSignal: true, workItemIsTheParents: true });
    });

    // A PLANNER FANS OUT EXPLORERS AND THEN WAITS, which is exactly the shape [BACKGROUND] governs: a
    // turn that ends waiting on a detached task hangs the work item for good, because nothing wakes it.
    // This rule was nearly lost — it was in four of the five planner prompts and absent from the fifth,
    // so an "identical across all five" filter dropped it while building this payload.
    it('VALID: served payload => carries the [BACKGROUND] rule its explorers make necessary', () => {
      expect({
        theRule: hasIn({
          needle:
            '**[BACKGROUND] Never end your turn waiting for a background task, and never poll one.**',
          text: MARKDOWN,
        }),
        namesTheCost: hasIn({
          needle: 'a turn that ends waiting on one hangs your work item for good',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ theRule: true, namesTheCost: true });
    });

    // Only the reviewer builds and wards a round: `tsc` writes one shared `dist/` per package, and
    // ward's typecheck is `tsc -b`, which builds. A planner that ran either would hand every sibling
    // session type errors that are not real.
    it('VALID: served payload => leaves the build and the ward to the reviewer', () => {
      expect({
        runsNeither: hasIn({
          needle: '**[WARD] You run no build, no ward, no test and no check of any kind.**',
          text: MARKDOWN,
        }),
        overridesTheSnippets: hasIn({
          needle: 'neither is written for a session that runs neither command',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ runsNeither: true, overridesTheSnippets: true });
    });

    // `rework` sends the parent back to the step where it reads the document, and it finds no
    // `## Plan` there. All the parent can do is spend one more planner dispatch on the same round, and
    // a second empty read costs the whole piece of work a `partial`.
    it('VALID: served payload => narrows the three `NEXT:` values to the planner`s two', () => {
      expect({
        exactlyTwo: hasIn({
          needle: '**You have exactly TWO values**, not three.',
          text: MARKDOWN,
        }),
        neverRework: hasIn({
          needle: '**The [WALL] rule above names a third value, `NEXT: rework`. Never write it.**',
          text: MARKDOWN,
        }),
        unplannableIsAChunk: hasIn({
          needle: '**Work you could not plan cleanly is a CHUNK.**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ exactlyTwo: true, neverRework: true, unplannableIsAChunk: true });
    });

    // THE PRECEDENCE RULE WAS IN ONE PROMPT, NOT FIVE, so the "identical across all five" filter that
    // built this payload never considered it and four planners were served no ranking at all — no
    // answer for a flow graph and a git history that contradict each other. Its four lines name no
    // role and no kind of work, which is what makes "it was only in one prompt" an accident of
    // authorship rather than a reason to leave it there. Pinned here so the next filter cannot lose it.
    it('VALID: served payload => ranks the four sources a planner reads against each other', () => {
      expect({
        theHeading: hasIn({ needle: '## What wins, when four sources disagree', text: MARKDOWN }),
        graphOutranksTheRest: hasIn({
          needle:
            '**The flow graph wins.** The USER approved it, and it does not change mid-quest.',
          text: MARKDOWN,
        }),
        gitIsTheRecord: hasIn({
          needle: '**Git is the record of what happened.** Work not in git did not happen.',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ theHeading: true, graphOutranksTheRest: true, gitIsTheRecord: true });
    });

    // A missing document is the one dispatch failure a planner cannot work around, and reading it as
    // `rework` would spend a second planner on the same broken dispatch.
    it('VALID: served payload => makes a missing round document a wall', () => {
      expect(
        hasIn({ needle: '**A missing document is a wall, not `rework`.**', text: MARKDOWN }),
      ).toBe(true);
    });
  });
});
