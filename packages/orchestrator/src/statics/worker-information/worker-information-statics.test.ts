import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { roundProtocolStatics } from '../round-protocol/round-protocol-statics';

import { workerInformationStatics } from './worker-information-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const MARKDOWN = workerInformationStatics.markdown;

// `<dungeonmaster-ward-discipline>` is the NAME of a session snippet the [WARD] rule overrides by
// name, not this repo's word for a kind of work. Strip the citation before the check below, or the
// `discipline` needle matches the one place the word legitimately appears.
const WARD_DISCIPLINE_SNIPPET = /<dungeonmaster-ward-discipline>/gu;

const SEARCHABLE = MARKDOWN.toLowerCase().replace(WARD_DISCIPLINE_SNIPPET, '');

// `implementation` is deliberately NOT on this list, though it names one of the five kinds of work.
// It is also an ordinary English word this payload has to use, so a needle for it reports a defect
// on every honest sentence. `roundProtocolStatics`' own test omits it for the same reason.
const DISCIPLINE_WORDS = [
  'discipline',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
] as const;

describe('workerInformationStatics', () => {
  it('VALID: exported value => is exactly one markdown payload and nothing else', () => {
    expect(workerInformationStatics).toStrictEqual({
      markdown: expect.stringMatching(/^# Worker information\n.+$/su),
    });
  });

  describe('what the MCP layer will do with it', () => {
    // `get-worker-information` serves this whole, once per chunk in a wave. Over `maxVerbatimChars`
    // the MCP layer writes the result to a file and hands the agent an error stub. BYTES, not
    // characters: the size-cap test in `mcp-server-flow.integration.test.ts` measures the same way.
    it('VALID: served payload => fits the MCP verbatim ceiling in bytes', () => {
      expect(Buffer.byteLength(MARKDOWN, 'utf8')).toBeLessThan(
        mcpToolResultStatics.maxVerbatimChars,
      );
    });

    it('VALID: served payload => carries no template placeholder', () => {
      expect({
        arguments: hasIn({ needle: '$ARGUMENTS', text: MARKDOWN }),
        discipline: hasIn({ needle: '$DISCIPLINE', text: MARKDOWN }),
        myDiscipline: hasIn({ needle: '$MY_DISCIPLINE', text: MARKDOWN }),
      }).toStrictEqual({ arguments: false, discipline: false, myDiscipline: false });
    });
  });

  // THE WHOLE REASON THE TOOL TAKES NO ARGUMENT. A shared file that hedged across five kinds of work
  // stated all five, and served a manual-QA worker eight sentences that were simply false for it.
  it.each(agentPromptClassificationStatics.operatorRoleNames)(
    'VALID: served payload => never names the role %s',
    (role) => {
      expect(hasIn({ needle: role, text: SEARCHABLE })).toBe(false);
    },
  );

  it.each(DISCIPLINE_WORDS)('VALID: served payload => never names the discipline %s', (word) => {
    expect(hasIn({ needle: word, text: SEARCHABLE })).toBe(false);
  });

  describe('the blocks it carries, and the three it withholds', () => {
    it('VALID: served payload => embeds the four protocol blocks a worker reads', () => {
      expect({
        document: hasIn({ needle: roundProtocolStatics.document, text: MARKDOWN }),
        briefKeys: hasIn({ needle: roundProtocolStatics.briefKeys, text: MARKDOWN }),
        chunkFields: hasIn({ needle: roundProtocolStatics.chunkFields, text: MARKDOWN }),
        nextLine: hasIn({ needle: roundProtocolStatics.nextLine, text: MARKDOWN }),
      }).toStrictEqual({ document: true, briefKeys: true, chunkFields: true, nextLine: true });
    });

    // `planBlocks` and `indexes` describe how a plan is BUILT, which is its planner's business — a
    // worker executes the one chunk it was handed and re-cuts nothing. `commitSubjects` is withheld
    // because this session commits nothing, and a subject list it cannot use is a list it might try
    // to.
    it('VALID: served payload => withholds the blocks a worker must not act on', () => {
      expect({
        planBlocks: hasIn({ needle: roundProtocolStatics.planBlocks, text: MARKDOWN }),
        indexes: hasIn({ needle: roundProtocolStatics.indexes, text: MARKDOWN }),
        commitSubjects: hasIn({ needle: roundProtocolStatics.commitSubjects, text: MARKDOWN }),
      }).toStrictEqual({ planBlocks: false, indexes: false, commitSubjects: false });
    });
  });

  describe('the rules a worker cannot be served without', () => {
    // A minion holding a `workItemId` that belongs to its PARENT could complete its parent's scope and
    // advance the relay mid-round.
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

    // These two bans are what make a WAVE of workers safe to run at once, and both are measured
    // rather than stylistic. Losing either is invisible until several workers are already running.
    it('VALID: served payload => bans every build, refuses the build-first mechanic, and bans git', () => {
      expect({
        oneSharedDist: hasIn({
          needle: '`tsc` writes one shared `dist/` per package',
          text: MARKDOWN,
        }),
        buildsNothingAtAll: hasIn({
          needle:
            '**`npm run build`, ever. YOU BUILD NOTHING** — not to check a type, not to see whether something compiles, not before your ward and not after it.',
          text: MARKDOWN,
        }),
        // THE WARD-DISCIPLINE SNIPPET SAYS "BUILD FIRST", and every session in this repo is handed it
        // at start. This payload used to repeat that mechanic as one of three that still applied —
        // to a reader banned from building. It is the one mechanic a worker will assume carries over,
        // so the text now names it and refuses it rather than staying silent.
        refusesTheBuildFirstMechanic: hasIn({
          needle:
            '**That snippet\'s FIRST mechanic — "build first" — does NOT apply, and it is the one you will assume does.**',
          text: MARKDOWN,
        }),
        gitAllOfIt: hasIn({ needle: '**Git, all of it**', text: MARKDOWN }),
        indexLockMeasured: hasIn({
          needle: 'three landed and nine died with `Unable to create index.lock`',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        oneSharedDist: true,
        buildsNothingAtAll: true,
        refusesTheBuildFirstMechanic: true,
        gitAllOfIt: true,
        indexLockMeasured: true,
      });
    });

    // The parent may not open a source file, so a pasted report goes to a session that cannot check a
    // word of it while burning the context that session needs to finish dispatching the round.
    it('VALID: served payload => keeps the return to two lines', () => {
      expect({
        twoLines: hasIn({
          needle: '## What you return — TWO lines, never the report',
          text: MARKDOWN,
        }),
        neverPaste: hasIn({
          needle: '**Never paste the report into your return.**',
          text: MARKDOWN,
        }),
        // The four `rework` triggers here are the ones every worker shares. Each prompt adds its own —
        // a bug-repro worker that could not reproduce, a manual-QA worker whose dev server stopped
        // answering — and a reader that took this list as complete would swallow exactly those. So the
        // list has to announce that it is partial at the point of use.
        listIsPartial: hasIn({
          needle: '**Your own prompt adds more, and every one it adds is as binding as these:**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({ twoLines: true, neverPaste: true, listIsPartial: true });
    });

    // No chunk carries a ward command. Without this line a worker looks for a `WARD:` field its
    // planner was told never to write. The second half points at the PROMPT rather than saying "you
    // build your own", because what a worker actually runs differs across the five — a `--only` table
    // over folder types on one, a Playwright run on another — so this file can name the step and not
    // the command.
    it('VALID: served payload => says no chunk carries a ward command', () => {
      expect(
        hasIn({
          needle:
            "**No chunk carries a ward command. Your own prompt's workflow says what you call**",
          text: MARKDOWN,
        }),
      ).toBe(true);
    });

    // THE COLLISION SET IS THE WAVE, AND THIS IS THE ONE PLACE IT IS STATED. Five prompts carried a
    // copy, each scoping the ban to "any chunk" and then to "any existing file" — which refused a
    // worker the value nothing passes down, the field somebody left off, or the call site its own
    // change had just broken, so it handed up a stub the round paid a `rework` for. The three open
    // kinds and the growth rule are what make the ward scope, the report's `FILES:` and the
    // reviewer's grading follow without a second rule anywhere.
    it('VALID: served payload => scopes the closed paths to the reader`s own wave', () => {
      expect({
        theHeading: hasIn({
          needle: '## Which paths are yours — the collision set is your WAVE',
          text: MARKDOWN,
        }),
        collisionNotPermission: hasIn({
          needle: '**`FILES` is a COLLISION boundary, not a permission list.**',
          text: MARKDOWN,
        }),
        liveWriterIsTheOnlyBan: hasIn({
          needle: '**A path a LIVE writer holds is the one kind closed to you.**',
          text: MARKDOWN,
        }),
        threeOpenKinds: hasIn({ needle: '| The path | Why nothing collides |', text: MARKDOWN }),
        existingIsOpen: hasIn({
          needle:
            "| an EXISTING file — an earlier wave's, or one no chunk names | it is committed and still |",
          text: MARKDOWN,
        }),
        filesGrows: hasIn({
          needle: '**Whatever you create or change JOINS your `FILES`.**',
          text: MARKDOWN,
        }),
        intentIsTheBound: hasIn({
          needle: '**Your `INTENT` is the bound, not the list.**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        theHeading: true,
        collisionNotPermission: true,
        liveWriterIsTheOnlyBan: true,
        threeOpenKinds: true,
        existingIsOpen: true,
        filesGrows: true,
        intentIsTheBound: true,
      });
    });

    // READ `INTENT` TWICE, AND THE SECOND READ IS THE ONE THAT WAS MISSING. The `RESULT:` block answers
    // it line by line, so a worker that read it once at the start answers it from memory at the end.
    // This sat in all five prompts, byte-identical but for one word in the manual-QA copy — four-of-five
    // is the same signal that moved `[BACKGROUND]`, and its second half restated `chunkFields`' own
    // yes/no test on top of that. `RESULT:` and `GOTCHAS` are named here because every one of the five
    // report blocks carries both fields; a field only some of them had could not be named in this file.
    it('VALID: served payload => makes the reader read `INTENT` twice', () => {
      expect({
        twice: hasIn({
          needle:
            '**Read your `INTENT` TWICE: before you start, and again before you write your report.**',
          text: MARKDOWN,
        }),
        namesWhyTheSecondReadMatters: hasIn({
          needle:
            'an `INTENT` you read once at the start is a list you answer from memory at the end',
          text: MARKDOWN,
        }),
        unanswerableGoesToGotchas: hasIn({
          needle: '**An assertion you cannot answer `yes` or `no` to is one to NAME in `GOTCHAS`**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        twice: true,
        namesWhyTheSecondReadMatters: true,
        unanswerableGoesToGotchas: true,
      });
    });

    // AN EMPTY SHELL IS FOR A NET NEW EXPORT ONLY, and stating it unconditionally is what sent a worker
    // to gut a working export so it could "start from red". The three cases are here rather than in the
    // five prompts because the arithmetic — what exists on disk decides what you write first — is the
    // same whatever kind of work the round is. The THIRD row is the honest one: the behaviour already
    // holds, so the assertion passes on its first run and a pass proves nothing. What to do about that
    // row differs per prompt, so this text hooks out rather than answering.
    it('VALID: served payload => scopes the empty shell to a NET NEW export', () => {
      expect({
        theHeading: hasIn({
          needle: '## Writing a test? This is how you get its red',
          text: MARKDOWN,
        }),
        threeCases: hasIn({
          needle: '| What the behaviour needs | What you write first | Where the red comes from |',
          text: MARKDOWN,
        }),
        shellIsFirstRowOnly: hasIn({
          needle: '**An EMPTY SHELL is for the first row only.**',
          text: MARKDOWN,
        }),
        existingCodeMakesNoShell: hasIn({
          needle: 'the test, and nothing else — **there is no shell to make**',
          text: MARKDOWN,
        }),
        namesWhatAShellWouldCost: hasIn({
          needle: 'writing one would mean deleting working logic to put it back later',
          text: MARKDOWN,
        }),
        noLogicBeforeTheRed: hasIn({
          needle: '**Write no logic until the red is in hand**',
          text: MARKDOWN,
        }),
        wrongValueRed: hasIn({
          needle: '**The red you need is a WRONG VALUE:**',
          text: MARKDOWN,
        }),
        thirdRowHooksOut: hasIn({
          needle: '**Your own prompt says what to do about that**',
          text: MARKDOWN,
        }),
        // A MANUAL-QA WORKER WRITES NO TEST until its walk finds a defect, so an unconditional "you
        // write a test" would be false for one of the five readers. The section opens conditionally.
        conditionalOnWritingOneAtAll: hasIn({
          needle: '**Not every chunk writes a test**',
          text: MARKDOWN,
        }),
      }).toStrictEqual({
        theHeading: true,
        threeCases: true,
        shellIsFirstRowOnly: true,
        existingCodeMakesNoShell: true,
        namesWhatAShellWouldCost: true,
        noLogicBeforeTheRed: true,
        wrongValueRed: true,
        thirdRowHooksOut: true,
        conditionalOnWritingOneAtAll: true,
      });
    });

    // BOTH HOOKS ARE LOAD-BEARING, so the shared text must state NEITHER. The browser-e2e prompt
    // widens the closed set by one — a sibling piece of work walks the same tree — and the manual-QA
    // prompt empties it, since every chunk there gets its own wave. A payload that named either
    // answer would be wrong for three of the five readers.
    it('VALID: served payload => leaves both per-prompt hooks open instead of answering them', () => {
      expect({
        asksTheProbeAboutLiveWriters: hasIn({
          needle: '**Your own prompt says whether anything beyond your wave counts as',
          text: MARKDOWN,
        }),
        asksThePromptForTheCases: hasIn({
          needle: 'Your own prompt names the cases that come up in your kind of work.',
          text: MARKDOWN,
        }),
        namesNoStepNumber: /\bstep \d/u.test(MARKDOWN),
      }).toStrictEqual({
        asksTheProbeAboutLiveWriters: true,
        asksThePromptForTheCases: true,
        namesNoStepNumber: false,
      });
    });
  });
});
