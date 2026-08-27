import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { workerInformationStatics } from '../worker-information/worker-information-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { roundProtocolStatics } from './round-protocol-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run — spaces, newlines, indent
// — on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Re-flowing a paragraph then reds nothing that is still true. Everything
// measuring real bytes or parsing a fence reads the block directly instead.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const BLOCK_KEYS = Object.keys(
  roundProtocolStatics,
) as readonly (keyof typeof roundProtocolStatics)[];

const TOTAL_CHARS = BLOCK_KEYS.reduce((sum, key) => sum + roundProtocolStatics[key].length, 0);

// ================================================================================================
// THE NAME LISTS ARE PARSED, NEVER COPIED. Every list below comes out of the block's own fence or
// table at module load. A field renamed in the served text and not here is what this file exists to
// red — a hand-written copy would go quiet at exactly that moment. Each derivation sits out here
// rather than inside an `it`, because the index fallbacks a parse needs are conditionals, and a
// conditional in a test body is banned.
// ================================================================================================
const CHUNK_FIELDS = Array.from(
  String(roundProtocolStatics.chunkFields.split('```')[1]).matchAll(/^([A-Z]+):/gmu),
  (match) => String(match[1]),
);

const BRIEF_KEYS = Array.from(
  String(roundProtocolStatics.briefKeys.split('```')[1]).matchAll(/^([A-Z]+):/gmu),
  (match) => String(match[1]),
);

const NEXT_VALUES = Array.from(
  String(roundProtocolStatics.nextLine.split('```')[1]).matchAll(/^NEXT: (\w+)/gmu),
  (match) => String(match[1]),
);

const INDEX_NAMES = Array.from(
  String(roundProtocolStatics.indexes.split('```')[1]).matchAll(/^([A-Z]+):$/gmu),
  (match) => String(match[1]),
);

const PLAN_BLOCK_NAMES = Array.from(
  roundProtocolStatics.planBlocks.matchAll(/^\| `([A-Z ]+)` \|/gmu),
  (match) => String(match[1]),
);

const COMMIT_SUBJECT_ROWS = Array.from(
  roundProtocolStatics.commitSubjects.matchAll(/^\| `([^`]+)` \| ([^|]+?) \|/gmu),
  (match) => ({ subject: String(match[1]), writer: String(match[2]) }),
);

describe('roundProtocolStatics', () => {
  it('VALID: exported value => is exactly the seven blocks and nothing else', () => {
    expect(roundProtocolStatics).toStrictEqual({
      document: expect.stringMatching(/^.+$/su),
      planBlocks: expect.stringMatching(/^.+$/su),
      chunkFields: expect.stringMatching(/^.+$/su),
      indexes: expect.stringMatching(/^.+$/su),
      briefKeys: expect.stringMatching(/^.+$/su),
      nextLine: expect.stringMatching(/^.+$/su),
      commitSubjects: expect.stringMatching(/^.+$/su),
    });
  });

  describe('invariants every block holds', () => {
    // Each block is interpolated into a prompt as a whole section. Without its own heading it
    // renders as loose prose after whatever came before it, and the reader cannot tell where the
    // previous section stopped.
    it.each(BLOCK_KEYS)('VALID: {block: %s} => opens with its own `##` heading', (key) => {
      expect(roundProtocolStatics[key].startsWith('## ')).toBe(true);
    });

    // Every consuming template is substituted ONCE, after this text is already inside it. A
    // placeholder written here would be replaced in a prompt that never meant to carry one, landing
    // one session's operation context in the middle of another's paperwork.
    it.each(BLOCK_KEYS)('VALID: {block: %s} => carries no template placeholder', (key) => {
      const text = roundProtocolStatics[key];

      expect({
        discipline: hasIn({ needle: '$DISCIPLINE', text }),
        myDiscipline: hasIn({ needle: '$MY_DISCIPLINE', text }),
        arguments: hasIn({ needle: '$ARGUMENTS', text }),
      }).toStrictEqual({ discipline: false, myDiscipline: false, arguments: false });
    });

    // THE WHOLE REASON THIS FILE IS SHARED. Twenty prompts interpolate these blocks, and each of
    // those prompts is one role's subject matter. A block that named a role, or reached for the
    // word `discipline` to avoid naming one, would be right in at most one of the twenty and
    // quietly wrong in the rest. What varies belongs in the prompt that varies.
    it.each(BLOCK_KEYS)('VALID: {block: %s} => names no role and no subject matter', (key) => {
      const text = roundProtocolStatics[key].toLowerCase();

      expect({
        discipline: hasIn({ needle: 'discipline', text }),
        codeweaver: hasIn({ needle: 'codeweaver', text }),
        pesteater: hasIn({ needle: 'pesteater', text }),
        flowrider: hasIn({ needle: 'flowrider', text }),
        groundstomper: hasIn({ needle: 'groundstomper', text }),
        siegemaster: hasIn({ needle: 'siegemaster', text }),
        bugRepro: hasIn({ needle: 'bug-repro', text }),
        belowBrowser: hasIn({ needle: 'below-browser', text }),
        browserE2e: hasIn({ needle: 'browser-e2e', text }),
        manualQa: hasIn({ needle: 'manual-qa', text }),
      }).toStrictEqual({
        discipline: false,
        codeweaver: false,
        pesteater: false,
        flowrider: false,
        groundstomper: false,
        siegemaster: false,
        bugRepro: false,
        belowBrowser: false,
        browserE2e: false,
        manualQa: false,
      });
    });

    // Fifteen of the twenty consumers are minions, and a minion has no work item of its own. The
    // `workItemId` in its briefing belongs to its PARENT, so a `signal-back` reference here would
    // complete the parent's scope and advance the relay mid-round.
    it.each(BLOCK_KEYS)('VALID: {block: %s} => never tells a reader to signal back', (key) => {
      expect(hasIn({ needle: 'signal-back', text: roundProtocolStatics[key] })).toBe(false);
    });
  });

  // A reviewer takes all seven. They land inside a template already sized against the protocol
  // ceiling, and over it the MCP layer spills the served result to a file and hands the agent an
  // error stub — so the session starts holding a path instead of its method. Half the ceiling is a
  // forcing function rather than the real bound: the served block is what has to fit, and each
  // consuming prompt's own colocated test measures that. What this one catches is the primer
  // growing until no template could carry it.
  it('VALID: every block together => leaves the consuming template most of the ceiling', () => {
    expect(TOTAL_CHARS).toBeLessThan(mcpToolResultStatics.maxVerbatimChars / 2);
  });

  describe('the names it pins for every reader', () => {
    // The holder is glossed at its first appearance because nine later uses depend on it and its
    // definition lives in this file's docblock, which no agent receives. The reviewer's own prompt
    // never uses the word at all — it says "your parent" — so an unglossed "the holder" is a
    // sentence about a session that reader knows by another name.
    it('VALID: document => names the six sections and who owns each', () => {
      const text = roundProtocolStatics.document;

      expect({
        path: hasIn({ needle: '`.quest-plans/<operationItemId>-round-<n>.md`', text }),
        title: hasIn({
          needle:
            '| `# Round <n> — …` | the holder (the session that dispatches the other three) |',
          text,
        }),
        context: hasIn({ needle: '| `## Context` | the holder |', text }),
        rework: hasIn({ needle: '| `## Rework` | the holder |', text }),
        plan: hasIn({ needle: '| `## Plan` | the planner |', text }),
        roundLog: hasIn({
          needle:
            '| `## Round log` | the planner writes the heading, each worker appends under it |',
          text,
        }),
        sweepAndReReview: hasIn({ needle: '| `## Sweep` / `## Re-review` | the holder |', text }),
      }).toStrictEqual({
        path: true,
        title: true,
        context: true,
        rework: true,
        plan: true,
        roundLog: true,
        sweepAndReReview: true,
      });
    });

    // A `SECTION:` brief names a section by NAME, and a round can hold two `## Sweep` sections —
    // a refused signal sends the holder back to its sweep step, which appends a fresh one. Without
    // the last-wins rule a second sweep reviewer sorts the first sweep's paths again.
    it('VALID: document => resolves a `SECTION:` line to the LAST section of that name', () => {
      const text = roundProtocolStatics.document;

      expect({
        lastWins: hasIn({
          needle:
            "**A brief's `SECTION:` line is what sends a session to `## Sweep` or `## Re-review`, and it names the LAST section of that name**",
          text,
        }),
        aRoundCanHoldTwo: hasIn({ needle: 'a second sweep appends a second `## Sweep`', text }),
      }).toStrictEqual({ lastWins: true, aRoundCanHoldTwo: true });
    });

    // The ids are read off the document, never retyped. Each is checked as a UUID downstream, so
    // one typed wrong is a REJECTED write rather than a degraded one — and the refusal then names a
    // missing record with nothing on the quest to show why.
    it('VALID: document => sends every reader to `## Context` for the three ids', () => {
      const text = roundProtocolStatics.document;

      expect({
        firstThreeLines: hasIn({
          needle: '**`## Context` carries the three ids on its first three lines**',
          text,
        }),
        questId: hasIn({ needle: '`Quest ID:`', text }),
        workItemId: hasIn({ needle: '`Work Item ID:`', text }),
        operationItemId: hasIn({ needle: '`Operation Item ID:`', text }),
        checkedAsUuid: hasIn({ needle: 'The server checks each as a UUID', text }),
      }).toStrictEqual({
        firstThreeLines: true,
        questId: true,
        workItemId: true,
        operationItemId: true,
        checkedAsUuid: true,
      });
    });

    // `Write` and `Edit` both read the whole file and write it back, so a wave of workers appending
    // at once loses a block between them. The report region sits at the BOTTOM of the document for
    // exactly this reason, rather than under each chunk where it would read better and race.
    it('VALID: document => makes every later write an append with a quoted heredoc', () => {
      const text = roundProtocolStatics.document;

      expect({
        appendWithDoubleArrow: hasIn({
          needle:
            "**Every write after the holder's first — the planner's `## Plan`, each worker's report — is an APPEND, with `>>`.**",
          text,
        }),
        namesTheRace: hasIn({ needle: 'read the whole file and write it back', text }),
        quotedHeredoc: hasIn({ needle: "cat >> <the PLAN: path from your brief> <<'DOC'", text }),
        reportHeadingIsDistinct: hasIn({
          needle:
            "**A `### report — chunk 3` heading is a REPORT and a `### chunk 3` heading is the PLAN's.**",
          text,
        }),
        nobodyRewritesAnother: hasIn({
          needle: '**Nobody rewrites a section somebody else wrote.**',
          text,
        }),
      }).toStrictEqual({
        appendWithDoubleArrow: true,
        namesTheRace: true,
        quotedHeredoc: true,
        reportHeadingIsDistinct: true,
        nobodyRewritesAnother: true,
      });
    });

    // `Edit` is correct for exactly one of the four readers. The holder's own tool table forbids
    // `Edit` on this file outright, a worker appends beside siblings in a wave where `Edit` is what
    // loses a block, and the reviewer has no section of its own and is told elsewhere that
    // rewriting the document is not its job. So the permission is attributed rather than addressed.
    it('VALID: document => attributes `Edit` to the session alone on the file', () => {
      const text = roundProtocolStatics.document;

      expect({
        aloneMayEdit: hasIn({
          needle:
            'A session alone on the file corrects its own section with `Edit`, inside that section only',
          text,
        }),
        appendingSiblingGetsOneShot: hasIn({
          needle: 'a session appending beside siblings never edits, and gets one shot',
          text,
        }),
        theCommitterWritesNothing: hasIn({
          needle: 'The session that reviews and commits this file writes nothing into it.',
          text,
        }),
      }).toStrictEqual({
        aloneMayEdit: true,
        appendingSiblingGetsOneShot: true,
        theCommitterWritesNothing: true,
      });
    });

    it('VALID: planBlocks => names the five blocks in the order they are built', () => {
      expect(PLAN_BLOCK_NAMES).toStrictEqual([
        'TOUCHES',
        'DEPENDS',
        'DECISIONS',
        'ASSERTIONS',
        'NO CHUNK',
      ]);
    });

    it('VALID: planBlocks => states the build order and why the indexes come last', () => {
      const text = roundProtocolStatics.planBlocks;

      expect({
        theOrder: hasIn({
          needle:
            '`TOUCHES` → `DEPENDS` → `DECISIONS` → `ASSERTIONS` → `NO CHUNK` → the chunks → `PHASES` → `WAVES`',
          text,
        }),
        leastUnderstandingFirst: hasIn({
          needle: 'The planner writes its first block with the least understanding of the round',
          text,
        }),
        indexesNameChunkNumbers: hasIn({
          needle: '`PHASES` and `WAVES` come last because they name CHUNK NUMBERS',
          text,
        }),
      }).toStrictEqual({
        theOrder: true,
        leastUnderstandingFirst: true,
        indexesNameChunkNumbers: true,
      });
    });

    // `NO CHUNK` is how a unit leaves the denominator without a chunk covering it, so its two words
    // are a wire format the reviewer parses. Anything it cannot parse it reports as uncovered.
    it('VALID: planBlocks => spells the two `NO CHUNK` line shapes and the empty case', () => {
      const text = roundProtocolStatics.planBlocks;

      expect({
        settled: hasIn({
          needle:
            '`- settled <unit-id> at <sha> → <where it is already true> — <the assertion read there>`',
          text,
        }),
        outOfMedium: hasIn({
          needle: '`- out-of-medium <unit-id> — <what cannot be reached, and why>`',
          text,
        }),
        literalWords: hasIn({
          needle: '**`settled` and `out-of-medium` are literal, and nothing else parses.**',
          text,
        }),
        cheapestToFake: hasIn({
          needle:
            'It is the cheapest line in the plan to fake, and the reviewer opens what it cites',
          text,
        }),
        emptyCase: hasIn({
          needle:
            'the block reads `NO CHUNK: none` on one line, in those words, and nothing else parses',
          text,
        }),
        nowhereToHide: hasIn({
          needle:
            '**A unit that no chunk covers and no `NO CHUNK` line explains has nowhere left to hide.**',
          text,
        }),
      }).toStrictEqual({
        settled: true,
        outOfMedium: true,
        literalWords: true,
        cheapestToFake: true,
        emptyCase: true,
        nowhereToHide: true,
      });
    });

    // The reviewer is the only session that performs the subtraction and was never told what it
    // subtracted FROM: "the list" and "the full list" appeared in two blocks with no antecedent in
    // any of the seven. `TOUCHES` is the denominator, and this joins the two.
    it('VALID: planBlocks => names `TOUCHES` as the list the round is subtracted from', () => {
      const text = roundProtocolStatics.planBlocks;

      expect({
        theDenominator: hasIn({ needle: "**`TOUCHES` holds the round's full unit list.**", text }),
        whatComesOff: hasIn({
          needle: "`NO CHUNK` and the chunks' `UNITS` are what is removed from the full list",
          text,
        }),
        unparseableStaysOn: hasIn({
          needle: 'anything unparseable stays on it as uncovered',
          text,
        }),
      }).toStrictEqual({
        theDenominator: true,
        whatComesOff: true,
        unparseableStaysOn: true,
      });
    });

    it('VALID: chunkFields => names exactly the five fields, in the order the fence writes them', () => {
      expect(CHUNK_FIELDS).toStrictEqual(['INTENT', 'FILES', 'UNITS', 'MIRROR', 'NOTES']);
    });

    // `FILES` is ownership, and the split marker is what stops a half-landed unit reading as
    // finished: the reviewer subtracts covered ids from the full list, so two chunks carrying the
    // same bare id both vanish the moment either lands. The read-only relaxation is finished for
    // the reader who lives with it — a worker's whole staying-in-bounds discipline assumes `FILES`
    // means "mine, exclusively", so the sentence has to say what the exception does to that.
    it('VALID: chunkFields => keeps the ownership rule and how a split row READS', () => {
      const text = roundProtocolStatics.chunkFields;

      expect({
        ownership: hasIn({
          needle: 'Two chunks IN ONE WAVE must never list the same path they both WRITE',
          text,
        }),
        lastWriteWins: hasIn({
          needle: 'the second to write a shared file erases the first',
          text,
        }),
        readOnlyIsFree: hasIn({
          needle: 'nor does it bind on a path only READ, driven through or warded over',
          text,
        }),
        // THE BAN IS WAVE-SCOPED, and the planner is the reader that acts on it. Two chunks in
        // DIFFERENT waves may write one path, because the earlier wave is committed before the later
        // one starts. Scoped to "any chunk", this told a planner to split work that never raced.
        acrossWavesIsFree: hasIn({
          needle: '**Across waves the ban does not bind**',
          text,
        }),
        // A worker's list GROWS, so every later reader of the word `FILES` — the ward scope, the
        // report block, the reviewer's grading — means the grown list. Said here once instead of in
        // each of the five worker prompts.
        filesGrows: hasIn({
          needle: "**A worker's `FILES` GROWS**",
          text,
        }),
        everyPathIsAFile: hasIn({ needle: '**Every path is a FILE**', text }),
        bothRowsSaySo: hasIn({
          needle: '**One unit, ONE chunk — unless it is SPLIT, and then BOTH rows say so**',
          text,
        }),
        // THE LITERAL MARKER STAYS READABLE HERE. The worker is the reader that meets this
        // parenthetical in its own `UNITS` row, so prose it has to pattern-match against a string is
        // not enough — it needs the string. What does NOT belong here is the instruction to WRITE it
        // into two rows, which is an edit inside `## Plan` that a worker may not make. See the
        // reader-boundary describe below: the literal is present, the imperative is not.
        literalMarker: hasIn({
          needle: '`(part <n> of <m>; chunk <k> owns the rest)`',
          text,
        }),
        eachPartNamesTheOther: hasIn({ needle: 'each part naming the other', text }),
        everyPartLanded: hasIn({
          needle: '**A unit is covered only when EVERY part landed.**',
          text,
        }),
        unitsNoneWording: hasIn({
          needle:
            '`UNITS: none — <why this chunk exists>`, in those words, and nothing else parses',
          text,
        }),
      }).toStrictEqual({
        ownership: true,
        lastWriteWins: true,
        readOnlyIsFree: true,
        acrossWavesIsFree: true,
        filesGrows: true,
        everyPathIsAFile: true,
        bothRowsSaySo: true,
        literalMarker: true,
        eachPartNamesTheOther: true,
        everyPartLanded: true,
        unitsNoneWording: true,
      });
    });

    // `NOTES` used to read to a worker as a GUARANTEE that every outside usage was listed, and the
    // worker's usage-sweep step searches only the identifiers `NOTES` names — so an omission
    // shipped silently. Stated as a DEBT the row owes, a `NOTES` naming nothing is a claim the
    // worker can test rather than a promise it inherits.
    it('VALID: chunkFields => states `NOTES` as a debt, never as a guarantee', () => {
      const text = roundProtocolStatics.chunkFields;

      expect({
        owes: hasIn({
          needle: '**`NOTES` OWES whatever this chunk changes that other files USE**',
          text,
        }),
        namesNoneIsAClaim: hasIn({
          needle:
            'A chunk whose `NOTES` names none of those is claiming nothing outside it uses this work.',
          text,
        }),
        neverAlwaysNames: hasIn({ needle: '**`NOTES` always names', text }),
      }).toStrictEqual({ owes: true, namesNoneIsAClaim: true, neverAlwaysNames: false });
    });

    it('VALID: indexes => names both indexes in the fence', () => {
      expect(INDEX_NAMES).toStrictEqual(['PHASES', 'WAVES']);
    });

    // The holder executes the phase loop off `PHASES` and takes no `planBlocks`, so a `PHASES` with
    // no line rule leaves the one session that parses it inferring the parse. `WAVES` always had
    // one; this pins that `PHASES` does too.
    it('VALID: indexes => gives BOTH indexes a line rule, not just `WAVES`', () => {
      const text = roundProtocolStatics.indexes;

      expect({
        wavesLineRule: hasIn({ needle: 'One line per wave, numbered from 1 with no gaps.', text }),
        phasesLineRule: hasIn({
          needle:
            'One line per phase, numbered from 1 with no gaps, naming its wave range and what that phase makes true.',
          text,
        }),
      }).toStrictEqual({ wavesLineRule: true, phasesLineRule: true });
    });

    it('VALID: indexes => keeps the exactly-once rule and the zero-chunk wording', () => {
      const text = roundProtocolStatics.indexes;

      expect({
        zeroChunk: hasIn({
          needle:
            '**On a zero-chunk plan both read `PHASES: none` and `WAVES: none`, one line each, in those words, and nothing else parses.**',
          text,
        }),
        exactlyOnce: hasIn({ needle: '**Every chunk number appears in it exactly once.**', text }),
        nobodyRecuts: hasIn({ needle: '**Nobody but the planner re-cuts either index.**', text }),
        laterThanItsDependencies: hasIn({
          needle: '**A chunk goes in a later wave than anything it depends on**',
          text,
        }),
      }).toStrictEqual({
        zeroChunk: true,
        exactlyOnce: true,
        nobodyRecuts: true,
        laterThanItsDependencies: true,
      });
    });

    // The holder takes `indexes` and can neither assign a wave nor read `DEPENDS`, which its own
    // prompt never defines. Every wave-and-phase rule here is therefore stated as what the PLANNER
    // did, so the holder reads a description of the schedule it is executing rather than an
    // instruction it cannot carry out.
    it('VALID: indexes => attributes every grouping rule to the planner', () => {
      const text = roundProtocolStatics.indexes;

      expect({
        readOffDepends: hasIn({ needle: 'the planner read that off `DEPENDS`', text }),
        sharingGoesLater: hasIn({
          needle: '**The planner put a chunk sharing one of those four in a later wave.**',
          text,
        }),
        foundationAlone: hasIn({
          needle:
            '**The planner puts the chunks every later phase imports in a phase of its own.**',
          text,
        }),
        concurrencyIsUnattributed: hasIn({
          needle:
            '**Two chunks in one wave RUN AT THE SAME TIME, in ONE worktree, so they may not share anything.**',
          text,
        }),
      }).toStrictEqual({
        readOffDepends: true,
        sharingGoesLater: true,
        foundationAlone: true,
        concurrencyIsUnattributed: true,
      });
    });

    // `FILES` disjointness cannot see any of these four, which is why they are listed rather than
    // left to a planner's judgement about what "shared" means.
    it('VALID: indexes => names the four kinds of sharing `FILES` cannot see', () => {
      expect(
        hasIn({
          needle:
            'a long-running server, a report path a test runner writes, a reset command, and any file two chunks READ THROUGH rather than own',
          text: roundProtocolStatics.indexes,
        }),
      ).toBe(true);
    });

    // The fence shows `SECTION:` twice on purpose — once per value (`Sweep`, `Re-review`) a reviewer
    // brief may actually carry, the same split the table beneath it draws into two rows. Six lines,
    // five distinct keys.
    it('VALID: briefKeys => names all six brief lines, SECTION once per value', () => {
      expect(BRIEF_KEYS).toStrictEqual(['PLAN', 'WAVE', 'CHUNK', 'PHASE', 'SECTION', 'SECTION']);
    });

    // `SECTION:`/`PHASE:` replacing the pair is what tells a whole-round reviewer it IS one: the
    // absence of all three is the only signal it gets. The opening sentence counts ASSIGNMENTS
    // rather than LINES, because a worker's brief always carries two lines — `WAVE:` and `CHUNK:` —
    // and the earlier wording told that worker its own brief was malformed.
    it('VALID: briefKeys => keeps the mutual exclusion and the cross-check `WAVE:` buys', () => {
      const text = roundProtocolStatics.briefKeys;

      expect({
        oneAssignmentNotOneLine: hasIn({
          needle:
            'A brief carries a PATH and at most one ASSIGNMENT — the `WAVE:`/`CHUNK:` pair, a `PHASE:`, or a `SECTION:`',
          text,
        }),
        neverTwoOfThree: hasIn({
          needle:
            '**`SECTION:` and `PHASE:` each REPLACE the `WAVE:`/`CHUNK:` pair, and no brief carries two of the three.**',
          text,
        }),
        absenceIsTheSignal: hasIn({
          needle: 'A reviewer brief carrying none of them is the whole-round review',
          text,
        }),
        pathArrivesFilledIn: hasIn({ needle: '**The `PLAN:` path arrives filled in', text }),
        waveIsACrossCheck: hasIn({
          needle: '**`WAVE:` is a CROSS-CHECK, not an instruction.**',
          text,
        }),
        wavesShape: hasIn({
          needle:
            '`WAVES` is one line per wave, `<wave>: <the chunk numbers in it>`, and every chunk number appears in it exactly once',
          text,
        }),
        neverPasteAChunk: hasIn({ needle: 'The holder pastes no chunk into a brief.', text }),
      }).toStrictEqual({
        oneAssignmentNotOneLine: true,
        neverTwoOfThree: true,
        absenceIsTheSignal: true,
        pathArrivesFilledIn: true,
        waveIsACrossCheck: true,
        wavesShape: true,
        neverPasteAChunk: true,
      });
    });

    // Every reader's briefs carry a line beyond these five that their own prompt names: the
    // holder's all open with a `get-agent-prompt` fetch line and its second sweep brief adds one
    // more, the planner AUTHORS explorer and checker briefs, and a re-review brief carries a scope
    // line. Read as an absolute ban, the sentence a reader discards is the one that matters — the
    // one that stops a chunk being pasted in.
    it('VALID: briefKeys => bans a pasted chunk without banning a prompt-named line', () => {
      const text = roundProtocolStatics.briefKeys;

      expect({
        scopedToRoundBriefs: hasIn({
          needle: 'Nothing else is part of a brief, beyond a line the sending prompt names itself.',
          text,
        }),
        unqualifiedBan: hasIn({ needle: '**Nothing else goes into a brief.**', text }),
      }).toStrictEqual({ scopedToRoundBriefs: true, unqualifiedBan: false });
    });

    it('VALID: nextLine => carries exactly the three values, one per fence line', () => {
      expect(NEXT_VALUES).toStrictEqual(['continue', 'rework', 'wall']);
    });

    // A `wall` option wrapped onto a second line starts with `|`, which matches none of the three.
    // The parent then reads the return as carrying no `NEXT:` at all, treats that as `rework`, and
    // dispatches a full round into the wall that was just reported.
    it('VALID: nextLine => pins the one-line rule and what wrapping it costs', () => {
      const text = roundProtocolStatics.nextLine;

      expect({
        firstWordOfLastLine: hasIn({
          needle: '**The parent matches the FIRST WORD of the LAST line.**',
          text,
        }),
        oneLine: hasIn({
          needle: '**A minion writes `NEXT:` on ONE line and makes it the last line.**',
          text,
        }),
        wrappedStartsWithPipe: hasIn({
          needle: 'starts with `|`, which matches none of the three',
          text,
        }),
        writeNothingBeneath: hasIn({ needle: 'Nothing goes beneath that line.', text }),
        onlyTheReviewerDecides: hasIn({
          needle: "**Only the REVIEWER's line decides the round**",
          text,
        }),
      }).toStrictEqual({
        firstWordOfLastLine: true,
        oneLine: true,
        wrappedStartsWithPipe: true,
        writeNothingBeneath: true,
        onlyTheReviewerDecides: true,
      });
    });

    // Three values is the WIDEST list, not every reader's list: a planner's own prompt forbids it
    // `rework` in as many words, because a planner that cannot plan appends no `## Plan` and its
    // parent's next step reads a document with no plan in it and has no failure branch there.
    // Nothing else in the primer hints the list can be narrowed.
    it('VALID: nextLine => lets a role prompt narrow the three values', () => {
      expect(
        hasIn({
          needle:
            "**A role's own prompt may narrow this list. The values it names there are the only ones you have.**",
          text: roundProtocolStatics.nextLine,
        }),
      ).toBe(true);
    });

    // The routing column is the WORKER's answer only. For a reviewer, `continue` is the one line
    // that ends the parent's session and `rework` runs the whole loop again — opposite places, both
    // written as "goes to its next step" before this. And the holder does not stop dispatching on a
    // `wall`: it lets the wave finish and runs its sweep step, because it may not commit and the
    // server refuses a signal over a dirty tree. Per-role routing lives in the role prompts.
    it('VALID: nextLine => keeps the routing column invariant across its four readers', () => {
      const text = roundProtocolStatics.nextLine;

      expect({
        continueRow: hasIn({
          needle:
            "| `continue` | this session's own job is done and proved | keeps going; which step is next depends on whose line it is |",
          text,
        }),
        reworkRow: hasIn({
          needle:
            "| `rework` | something is not done, named in the round's own chunk terms | keeps going; which step is next depends on whose line it is |",
          text,
        }),
        wallRow: hasIn({
          needle:
            '| `wall` | an ENVIRONMENT wall no session of any role could pass | stops the round and halts the quest |',
          text,
        }),
        perRoleStepGuess: hasIn({ needle: 'goes to its next step', text }),
        stopsDispatching: hasIn({ needle: 'stops dispatching', text }),
      }).toStrictEqual({
        continueRow: true,
        reworkRow: true,
        wallRow: true,
        perRoleStepGuess: false,
        stopsDispatching: false,
      });
    });

    // FIVE, not six. `review <n>:` is gone: the reviewer's return block rides the body of the round
    // commit now, because the round reaches it uncommitted and it commits once.
    it('VALID: commitSubjects => names exactly the five subjects and who writes each', () => {
      expect(COMMIT_SUBJECT_ROWS).toStrictEqual([
        { subject: 'plan round <n>: <count> chunks', writer: 'the planner' },
        {
          subject: 'phase <n>: <what the phase made true>',
          writer: 'a reviewer on a `PHASE:` brief',
        },
        { subject: 'round <n>: <what the round made true>', writer: "the round's reviewer" },
        {
          subject: 'sweep: <what these paths are>',
          writer: 'a reviewer on a `SECTION: Sweep` brief',
        },
        {
          subject: 'sweep: uncommitted remainder',
          writer: 'a reviewer on a SECOND `SECTION: Sweep` brief',
        },
      ]);
    });

    // ONE COMMIT, AND ENUMERATION BEFORE IT. The two-commit split existed because the enumeration
    // read COMMITTED history under `scope: 'unpushed'` — but no worker commits any more, so at that
    // moment `@{upstream}..HEAD` held the planner's round-document commit and nothing else, and the
    // reviewer enumerated one markdown file. The enumeration reads the WORKING TREE now, which is
    // where an uncommitted round actually is, and the single commit lands after it.
    it('VALID: commitSubjects => keeps the no-worker-commits rule and commits once, after enumerating', () => {
      const text = roundProtocolStatics.commitSubjects;

      expect({
        noWorkerCommits: hasIn({ needle: '**No worker commits anything.**', text }),
        indexLockMeasured: hasIn({
          needle: 'three landed and nine died with `Unable to create index.lock`',
          text,
        }),
        noAuthorCommitsItsOwn: hasIn({
          needle:
            "So no session that wrote a chunk commits it: every commit on the round is a reviewer's, written by a session that has opened the files in it.",
          text,
        }),
        commitsOnce: hasIn({
          needle: '**The reviewer commits ONCE, and it is the LAST thing it does before pushing.**',
          text,
        }),
        arrivesUncommitted: hasIn({ needle: 'A round reaches it entirely uncommitted', text }),
        enumerateOverTheWorkingTree: hasIn({
          needle:
            'the reviewer enumerates its review units over the WORKING TREE, before committing',
          text,
        }),
        namesWhatCommittingFirstCosts: hasIn({
          needle: 'measures a surface the round never put there',
          text,
        }),
        allowEmpty: hasIn({ needle: 'It passes `--allow-empty`', text }),
        fiveIsTheWholeList: hasIn({ needle: '**Those five are the whole list**', text }),
        // Pinned ABSENT: the split it replaced, and the premise that justified it.
        stillClaimsTwoCommits: hasIn({ needle: 'commits TWICE', text }),
        stillClaimsCommittedHistory: hasIn({ needle: 'reads COMMITTED history', text }),
      }).toStrictEqual({
        noWorkerCommits: true,
        indexLockMeasured: true,
        noAuthorCommitsItsOwn: true,
        commitsOnce: true,
        arrivesUncommitted: true,
        enumerateOverTheWorkingTree: true,
        namesWhatCommittingFirstCosts: true,
        allowEmpty: true,
        fiveIsTheWholeList: true,
        stillClaimsTwoCommits: false,
        stillClaimsCommittedHistory: false,
      });
    });

    // `briefKeys` defines FOUR reviewer brief modes and the table covers three. A re-review may fix
    // code and must leave the tree clean, and the five-subject list forbids inventing a sixth — so
    // the block has to say which existing subject it reuses, or the next planner reading `git log`
    // is left guessing.
    it('VALID: commitSubjects => routes a re-review to an existing subject', () => {
      const text = roundProtocolStatics.commitSubjects;

      expect({
        reReviewReusesReview: hasIn({
          needle: '**A `SECTION: Re-review` brief reuses `round <n>:`** and mints no sixth.',
          text,
        }),
        roundNumberIsReadByTheCommitter: hasIn({
          needle: "The committing reviewer reads `<n>` off the document's own `# Round <n>` title.",
          text,
        }),
      }).toStrictEqual({ reReviewReusesReview: true, roundNumberIsReadByTheCommitter: true });
    });
  });

  // A BLOCK MAY ONLY SAY WHAT EVERY ONE OF ITS READERS CAN ACT ON. `chunkFields` goes to the worker
  // as well as to the two planning readers, and a worker can neither size a chunk nor add one — it
  // executes exactly the one it was handed. Sizing and cutting therefore live in `planBlocks`, which
  // the worker does not take. Both paragraphs below shipped inside `chunkFields` until a placement
  // audit read that block as its worker and found ~400 characters it could only ignore.
  //
  // This pins the boundary from BOTH sides on purpose: moving a paragraph back into `chunkFields`
  // reds the first half, and losing it altogether reds the second.
  describe('the reader boundary between describing a chunk and cutting one', () => {
    it('VALID: chunkFields => tells nobody to size, split or add a chunk', () => {
      const text = roundProtocolStatics.chunkFields;

      expect({
        keepThemSmall: hasIn({ needle: 'Keep every chunk small enough for ONE worker', text }),
        splitWhenUnsure: hasIn({ needle: 'Split when unsure', text }),
        unplannableStillGetsOne: hasIn({ needle: 'still gets a chunk', text }),
      }).toStrictEqual({
        keepThemSmall: false,
        splitWhenUnsure: false,
        unplannableStillGetsOne: false,
      });
    });

    it('VALID: planBlocks => carries the sizing rule and the unplannable-work rule instead', () => {
      const text = roundProtocolStatics.planBlocks;

      expect({
        keepThemSmall: hasIn({
          needle: 'Keep every chunk small enough for ONE worker to hold in full',
          text,
        }),
        namesWhatOversizeCosts: hasIn({
          needle: 'its worker skims an over-large one, and a green run hides what it skipped',
          text,
        }),
        splitWhenUnsure: hasIn({ needle: 'Split when unsure.', text }),
        unplannableStillGetsOne: hasIn({
          needle: '**Work the planner cannot plan cleanly still gets a chunk**',
          text,
        }),
        routesNowhere: hasIn({ needle: 'Leaving it out of the plan routes it nowhere.', text }),
      }).toStrictEqual({
        keepThemSmall: true,
        namesWhatOversizeCosts: true,
        splitWhenUnsure: true,
        unplannableStillGetsOne: true,
        routesNowhere: true,
      });
    });

    // MERGING two chunks and WRITING a marker into two chunks' rows are both re-planning, and both
    // shipped inside `chunkFields` addressed to a worker that is told two sections later to touch
    // nothing above `## Round log`. `planBlocks` reaches the planner and the reviewer and nobody
    // else, which is exactly the pair that can act on either.
    // THE BOUNDARY IS THE IMPERATIVE, NOT THE STRING. A worker meets `(part <n> of <m>)` in its own
    // `UNITS` row and has to recognise it, so the literal belongs in `chunkFields` — pinned as
    // PRESENT by the test above. What a worker cannot do is act on either instruction below: merging
    // two chunks is re-planning the round, and writing the marker into BOTH rows is an edit inside
    // `## Plan`, a section it is told to touch nothing above. Both are the planner's, so both live in
    // `planBlocks`, which the worker does not take.
    it('VALID: chunkFields => carries neither the merge remedy nor the instruction to write both rows', () => {
      const text = roundProtocolStatics.chunkFields;

      expect({
        mergeRemedy: hasIn({ needle: 'genuinely need to write one file are', text }),
        writeIntoBothRows: hasIn({
          needle: 'takes `(part <n> of <m>; chunk <k> owns the rest)` in',
          text,
        }),
      }).toStrictEqual({ mergeRemedy: false, writeIntoBothRows: false });
    });

    it('VALID: planBlocks => carries the merge remedy and the split marker instead', () => {
      const text = roundProtocolStatics.planBlocks;

      expect({
        mergeRemedy: hasIn({
          needle: '**Two chunks that genuinely need to write one file are ONE chunk.**',
          text,
        }),
        writeIntoBothRows: hasIn({
          needle:
            'A unit split across two takes `(part <n> of <m>; chunk <k> owns the rest)` in BOTH rows, each naming the other.',
          text,
        }),
      }).toStrictEqual({ mergeRemedy: true, writeIntoBothRows: true });
    });
  });

  // SAID TWICE COSTS THE REVIEWER TWICE. A reviewer holds this primer, `standardsReviewConcerns`
  // and six operating rules at once — roughly 24,000 characters of shared text — so a sentence one
  // of the others already carries is paid for in characters AND in drift, because the two copies
  // then move independently. Each needle below is a sentence that was cut for exactly that reason,
  // pinned as ABSENT so it cannot creep back, beside the block that still carries it.
  describe('what a block leaves to another block the same reader takes', () => {
    it('VALID: nextLine => leaves the wall vocabulary to the [WALL] rule', () => {
      const text = roundProtocolStatics.nextLine;

      expect({
        wallIsFor: hasIn({
          needle:
            '**`wall` is for a denied command, a missing credential or an unreachable service**',
          text,
        }),
        restartableIsRework: hasIn({
          needle: 'A wall a parent can clear by restarting something it owns',
          text,
        }),
      }).toStrictEqual({ wallIsFor: false, restartableIsRework: false });
    });

    // The [WALL] rule moved twice. It lived in one shared statics object, was inlined into all twenty
    // prompts, and now lives once more in the three per-family information payloads the MCP tools
    // serve. `nextLine` reaches a worker through `workerInformationStatics`, so that is where the two
    // sentences it declines to repeat have to be found.
    it('VALID: workerInformation => still carries both, for every reader of `nextLine`', () => {
      const text = workerInformationStatics.markdown;

      expect({
        wallIsFor: hasIn({
          needle:
            'A missing credential, an unreachable service and a tool the sandbox does not expose are the same kind of thing.',
          text,
        }),
        restartableIsRework: hasIn({
          needle:
            '**A wall your parent can clear by restarting something it owns is `NEXT: rework`, not `NEXT: wall`.**',
          text,
        }),
      }).toStrictEqual({ wallIsFor: true, restartableIsRework: true });
    });

    it('VALID: nextLine => leaves "a return ends on one line" to [TURN END]', () => {
      expect({
        inPrimer: hasIn({
          needle:
            "**Every minion's return ENDS with one line, and that line is the only one its parent acts on.**",
          text: roundProtocolStatics.nextLine,
        }),
        inOperatingRules: hasIn({
          needle: 'The LAST line of that block is always `NEXT:`',
          text: workerInformationStatics.markdown,
        }),
      }).toStrictEqual({ inPrimer: false, inOperatingRules: true });
    });

    it('VALID: commitSubjects => leaves the completion gate to the standing concerns', () => {
      expect({
        inPrimer: hasIn({
          needle: "the holder's completion gate measures a range that includes the commit",
          text: roundProtocolStatics.commitSubjects,
        }),
        inConcerns: hasIn({
          needle:
            "the completion gate recomputes this ledger against everything your parent's work item committed",
          text: standardsReviewConcernsStatics.markdown,
        }),
      }).toStrictEqual({ inPrimer: false, inConcerns: true });
    });
  });
});
