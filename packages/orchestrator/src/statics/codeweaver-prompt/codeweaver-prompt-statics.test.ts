import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true. The size assertion reads real
// bytes instead, because bytes are what the MCP layer weighs.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = codeweaverPromptStatics.prompt.template;

// THE FENCED BRIEF TEMPLATE IS THE ONLY PART A SUB-AGENT EVER READS — the operator copies it into an
// `Agent` call and everything around it stays in the operator's own context. So a needle found
// anywhere in the whole prompt proves nothing about what the sub-agent was told, and every rule a
// sub-agent has to obey is asserted against this slice instead.
const BRIEF_TEMPLATE_START = TEMPLATE.indexOf('\nFILES\n');
const BRIEF_TEMPLATE = TEMPLATE.slice(
  BRIEF_TEMPLATE_START,
  TEMPLATE.indexOf('\n```', BRIEF_TEMPLATE_START),
);

describe('codeweaverPromptStatics', () => {
  // THE SERVER SUBSTITUTES THE OPERATION CONTEXT AT `$ARGUMENTS`. A second slot would split that
  // context in two, and a slot that is not last buries it under instructions already read.
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: codeweaverPromptStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // OVER `maxVerbatimChars` THE MCP LAYER SPILLS THE RESULT TO A FILE and hands the agent an error
  // stub. This template has no interpolation left to resolve, so the served text IS this literal.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE HEADING LIST IS THE SHAPE OF THE ROLE. Pinning the LINES rather than the count is what
  // catches a section silently deleted or renamed.
  it('VALID: served template => names its nine top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      "## Reading a sub-agent's return",
      '## Briefing a sub-agent',
      '## Recording what you claim',
      '## Operation Context',
    ]);
  });

  // THE SCRIPT IS THE WHOLE OF WHAT THIS SESSION DOES. A step that changed which action it dispatches would still read as a valid nine-step script if only the count were
  // pinned, so the exact wording of each numbered heading is pinned instead.
  it('VALID: served template => names its nine script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow',
      '### 2. Explore the package',
      '### 3. Write your map',
      '### 4. Send the changes out',
      '### 5. Read what changed',
      '### 6. Run your reviewer',
      '### 7. Pass, or go round again',
      '### 8. Record what you claim, and what you found',
      '### 9. Signal',
    ]);
  });

  // THIS OPERATOR RUNS NO WARD — its REVIEWER runs the one `--uncommitted` sweep and its sub-agents
  // run their own scoped ones. Both of the forms it must never reach for are named in the FORBIDDEN
  // half of the tools table, right after the heading that opens it.
  it('VALID: served template => lists the reviewer sweep and the bare ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path but your map sub-agents write code, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run ward -- --uncommitted see [WARD SCOPE] npm run ward (bare) see [WARD SCOPE]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // ONLY THE REVIEWER'S `NEXT:` LINE DECIDES THE PASS. Pinned as the exact three-row table so a
  // fourth value slipping in, or one of the three being dropped, reds this test.
  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({
        needle:
          '| `pass` | go to step 8, and copy its `FINDINGS:` into your signal — anything it named for someone else survives nowhere else |',
        text: TEMPLATE,
      }),
      rework: hasIn({
        needle: '| `rework` | go back to step 4 and send out exactly what it named |',
        text: TEMPLATE,
      }),
      wall: hasIn({ needle: '| `wall` | go to step 8 and signal `blocked` |', text: TEMPLATE }),
      noCap: hasIn({
        needle: '**There is no cap. Keep going until your reviewer says `pass`.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, noCap: true });
  });

  // A SUB-AGENT'S OWN `rework` IS A CLAIM ABOUT ITS OWN CHANGE, NOT A VERDICT ON THE PASS — so this
  // table routes it back into step 4 rather than ending anything, and a missing line reads as rework.
  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | move on |', text: TEMPLATE }),
      rework: hasIn({
        needle:
          '| `rework` | it could not finish. Read what it says is left, and send that out again. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything already running finish, then go to step 8. |',
        text: TEMPLATE,
      }),
      missingLine: hasIn({
        needle: '| nothing starting `NEXT:` | treat it as `rework`, and say so when you signal |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, missingLine: true });
  });

  // SCOPE IS THE WHOLE RULE. Ward picks its check types off the paths it is handed, so a brief passes
  // its own paths and nothing else — `--uncommitted` grades the whole working tree and a bare run
  // grades the repo, and either one from a wave of sub-agents grades work that is not theirs and lands
  // its red on this session. The reviewer's single `--uncommitted` sweep is the one wide run on a pass.
  it("VALID: served template => scopes a sub-agent's own ward run to its own paths and forbids the wide forms", () => {
    expect({
      scopedRun: hasIn({
        needle: "npm run ward -- -- <this brief's own paths>",
        text: BRIEF_TEMPLATE,
      }),
      namesWhyOwnPathsOnly: hasIn({
        needle:
          'Each sub-agent you dispatch runs ward on its own files and\nnothing wider: `npm run ward -- -- <its own paths>`',
        text: TEMPLATE,
      }),
      neverWidens: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: BRIEF_TEMPLATE,
      }),
      neverRunWardMcpTool: hasIn({
        needle: '**The `run-ward` MCP tool is not the same command.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      scopedRun: true,
      namesWhyOwnPathsOnly: true,
      neverWidens: true,
      neverRunWardMcpTool: true,
    });
  });

  // THE SUB-AGENT HOLDS THE `run-ward` MCP TOOL ITSELF. Five of the ten code-writing sessions on one
  // measured pass called it, all five with `{}`, and all five got a raw zod dump naming three
  // missing fields. The operator-facing bullet explaining why sits OUTSIDE the fence, so the session
  // that needed it never read it — which is why this asserts on the fenced slice: the whole prompt
  // contains that bullet and would go green over a brief that says nothing.
  it('VALID: brief template => refuses the run-ward MCP tool inside the fence, under PROVE', () => {
    expect({
      inTheBrief: hasIn({
        needle:
          '**NEVER the run-ward MCP tool.** It is not another route to the same result: it grades the whole branch, and it takes a quest id and a work item id you were not given, so reaching for it spends a turn on a validation error. Call the command above.',
        text: BRIEF_TEMPLATE,
      }),
      afterThePROVEHeading:
        BRIEF_TEMPLATE.indexOf('NEVER the run-ward MCP tool') > BRIEF_TEMPLATE.indexOf('\nPROVE\n'),
      operatorBulletKept: hasIn({
        needle:
          '**The `run-ward` MCP tool is not the same command.** It grades the whole branch and lands the red\n  on your work item.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ inTheBrief: true, afterThePROVEHeading: true, operatorBulletKept: true });
  });

  // 1a. ONE BLOCK, ONE ROW PER UNIT. `DO` and a separate `MUST BE TRUE` wanted the same content, so
  // a brief with twenty units had to write twenty rows twice — and the operator dropped the half
  // carrying the quoted text. Measured on one pass: sixteen branch and terminal ids reached none of
  // the twelve briefs, and four of the nine code briefs carried no `MUST BE TRUE` block at all.
  // A terminal and a branch are ordinary tagged rows here rather than a second concept with no slot.
  it('VALID: brief template => folds every unit into ONE tagged UNITS block and refuses a brief without it', () => {
    expect({
      taggedRow: hasIn({
        needle:
          '<unit-id>  [observable | terminal | branch]  "<its text, word for word from the quest>"',
        text: BRIEF_TEMPLATE,
      }),
      assertLine: hasIn({
        needle: 'ASSERT:   <the exact value a test reads to settle it>',
        text: BRIEF_TEMPLATE,
      }),
      failsIfLine: hasIn({
        needle: 'FAILS IF: <the wrong value that turns that assertion red>',
        text: BRIEF_TEMPLATE,
      }),
      unworkableWithoutIt: hasIn({
        needle:
          'A brief carrying no UNITS block is not workable, and the units are not yours to guess: answer NEXT: rework and name the omission.',
        text: BRIEF_TEMPLATE,
      }),
      secondBlockGone: BRIEF_TEMPLATE.includes('MUST BE TRUE'),
    }).toStrictEqual({
      taggedRow: true,
      assertLine: true,
      failsIfLine: true,
      unworkableWithoutIt: true,
      secondBlockGone: false,
    });
  });

  // 1b. `RETURN` ASKED FOR A WATCHED RED WITH NO PROCEDURE BEHIND IT, and three sessions invented
  // three incompatible answers — one hand-ran six mutation cycles (12 edits, 10 ward runs, ~6
  // minutes), one refused to fabricate and said so three times, one hedged into 90 words describing
  // no red at all. The git hazard clause is why the restore is an EDIT: `git checkout --` on a
  // branch other sessions share throws away work that is not this session's.
  it('VALID: brief template => carries RED FIRST with the git hazard clause and the no-prior-red case', () => {
    expect({
      watchItFail: hasIn({
        needle:
          'RED FIRST\n  Watch it fail before you make it pass, and name that red in the return.',
        text: BRIEF_TEMPLATE,
      }),
      breakTheOneLine: hasIn({
        needle:
          'Break the ONE line the test guards, run the spec, capture the red, then put that line back BY EDITING IT BACK — never git checkout --, on a branch other sessions share. Confirm git diff on that file is empty afterwards.',
        text: BRIEF_TEMPLATE,
      }),
      newCodeCase: hasIn({
        needle:
          'New code and its test written together, with no earlier behaviour to break? Run the spec before the code exists and report THAT red — the module that does not resolve, the export that is not defined.',
        text: BRIEF_TEMPLATE,
      }),
      inventsNothing: hasIn({
        needle:
          'never fabricate a red you did not watch, never hedge it into a paragraph, and never invent a mutation protocol. Nobody asked for one.',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({
      watchItFail: true,
      breakTheOneLine: true,
      newCodeCase: true,
      inventsNothing: true,
    });
  });

  // 1c. THE COMMAND IS QUOTED AS A LITERAL AND NAMED AS THE ONE TO CALL. Two separate `--` tokens is
  // the real invocation, and a `PROVE` block that merely printed the line left five sessions
  // reaching for the MCP tool instead. The discovery-mismatch line is flowrider's, and codeweaver
  // lacked it: seven of nine returns spent a paragraph defending an e2e skip nobody had questioned.
  it('VALID: brief template => quotes the exact two-token ward command and settles a DISCOVERY MISMATCH', () => {
    expect({
      imperative: hasIn({
        needle:
          'Verify your work by calling THIS EXACT COMMAND. Two separate `--` tokens — that is the real invocation, not a typo:',
        text: BRIEF_TEMPLATE,
      }),
      quotedLiteral: hasIn({
        needle: "`npm run ward -- -- <this brief's own paths>`",
        text: BRIEF_TEMPLATE,
      }),
      ownPathsKept: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: BRIEF_TEMPLATE,
      }),
      mcpIsNoAlternative: hasIn({
        needle: 'It is not another route to the same result',
        text: BRIEF_TEMPLATE,
      }),
      discoveryMismatch: hasIn({
        needle:
          'DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix, and a skip is nothing to defend in the return.',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({
      imperative: true,
      quotedLiteral: true,
      ownPathsKept: true,
      mcpIsNoAlternative: true,
      discoveryMismatch: true,
    });
  });

  // 1d. THE BRIEF IS A GUESS AND THE SUB-AGENT IS THE ONE WITH THE CODE OPEN. Stated only in the
  // operator's own half of the page, it reaches nobody who could act on it, so it goes in the fence.
  it('VALID: brief template => tells the sub-agent the brief is a best guess and that hard evidence wins', () => {
    expect(
      hasIn({
        needle:
          "Every direction above is the operator's best guess across a file set that proves a feature. You have the code open and it does not, so where you find HARD EVIDENCE against a direction, the evidence wins — follow it.",
        text: BRIEF_TEMPLATE,
      }),
    ).toBe(true);
  });

  // 1e. DEVIATING IS PERMITTED; HIDING IT IS NOT. A brief's pseudo-code compared a status literal
  // the `ban-quest-status-literals` rule refuses, so the sub-agent swapped in a guard matching a
  // wider set of statuses — a real behaviour defect — and reported the swap on the `FILES:` line of
  // a `NEXT: pass`. Undoing it cost a whole extra brief: 15.5 minutes, 57 tool calls, 319k tokens.
  it('VALID: brief template => routes a forced deviation to NOT PROVED or rework, never a note on a pass', () => {
    expect({
      neverAFootnote: hasIn({
        needle:
          '**Every deviation comes back under NOT PROVED, or on the NEXT: rework line. Never as a note on a pass.**',
        text: BRIEF_TEMPLATE,
      }),
      why: hasIn({
        needle:
          'The operator chose that sketch against the flow, so a swap it never sees is a behaviour change nobody reviewed.',
        text: BRIEF_TEMPLATE,
      }),
      returnCarriesIt: hasIn({
        needle: 'or the deviation I was forced into and what forced it',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({ neverAFootnote: true, why: true, returnCarriesIt: true });
  });

  // 1f. THE SUB-AGENT EXPLORES FOR ITSELF. One that could not tell whether its brief or a lint rule
  // was right dispatched an explorer of its own — 24 tool calls, about two minutes — then deviated
  // silently anyway. Exploring is how a session learns the code it is about to change, so handing it
  // off puts that context in a summary rather than in the session doing the work.
  it('VALID: brief template => makes the sub-agent explore for itself and report what the repo refused', () => {
    expect({
      ownDiscovery: hasIn({
        needle:
          'Do your OWN discovery, with the discover tool. **Never dispatch a sub-agent to explore.**',
        text: BRIEF_TEMPLATE,
      }),
      whyItMatters: hasIn({
        needle:
          "Exploring is how you learn the code you are about to change; hand it off and what it found lands in someone else's summary instead of in the session doing the work.",
        text: BRIEF_TEMPLATE,
      }),
      refusalHasARoute: hasIn({
        needle:
          'The repo refusing what this brief says — a lint rule, a PreToolUse hook, a permission denial — is neither a wall nor something to work around silently. Name the rule and what it refused.',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({ ownDiscovery: true, whyItMatters: true, refusalHasARoute: true });
  });

  // 1g. WHEN TO DELEGATE AT ALL IS THE OPERATOR'S DECISION, AND THE SNIPPET DOES NOT COVER IT —
  // `<dungeonmaster-searchStrategy>` reaches every session and states how to hand a find back, never
  // whether the hand-off was worth making. Measured on the flowrider track, whose prompt has the same
  // gap: an operator sent an explorer to map this repo's e2e setup, and it built 103k of context and
  // returned `playwright.config.ts` quoted whole — a file one `Read` would have paid for once, paid
  // for three times instead. The clause is OPERATOR-facing, so it is asserted against the whole page
  // AND asserted ABSENT from the fenced brief, where the OPPOSITE rule binds a session already one
  // level down. Both sides are pinned together because they read as a contradiction if either drifts.
  it('VALID: served template => tells the OPERATOR to delegate a large search and read a file it can already name', () => {
    expect({
      searchNotRead: hasIn({ needle: '**Delegate a SEARCH, never a READ.**', text: TEMPLATE }),
      bigSearchSmallAnswer: hasIn({
        needle:
          'An explorer earns its hops where the search is large and the answer is small — "which of these seventy-odd files configures X" comes back as one path, and the hunt that found it never enters your context.',
        text: TEMPLATE,
      }),
      aNamedFileIsARead: hasIn({
        needle:
          'an explorer sent to fetch a path you have already written down is a `Read` with two extra hops and three times the tokens',
        text: TEMPLATE,
      }),
      briefIsJustTheQuestion: hasIn({
        needle:
          '**Brief it with the question and nothing else** — the return shape reaches it from the `<dungeonmaster-searchStrategy>` snippet.',
        text: TEMPLATE,
      }),
      namesItsOwnSubject: hasIn({
        needle: "**That licence is the OPERATOR's alone**",
        text: TEMPLATE,
      }),
      neverInsideTheWorkersBrief: hasIn({
        needle: 'Delegate a SEARCH, never a READ',
        text: BRIEF_TEMPLATE,
      }),
      workerStillForbiddenToExplore: hasIn({
        needle: '**Never dispatch a sub-agent to explore.**',
        text: BRIEF_TEMPLATE,
      }),
      workerToldWhichLevelItIs: hasIn({
        needle:
          'You sit one level below the operator that briefed you, and nothing goes below you.',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({
      searchNotRead: true,
      bigSearchSmallAnswer: true,
      aNamedFileIsARead: true,
      briefIsJustTheQuestion: true,
      namesItsOwnSubject: true,
      neverInsideTheWorkersBrief: false,
      workerStillForbiddenToExplore: true,
      workerToldWhichLevelItIs: true,
    });
  });

  // 2a. THE PROMPT FORBADE WHAT ITS OWN FENCE PERMITTED. Operator prose said a branch and a terminal
  // "never appear in a `MUST BE TRUE` line" and pointed at no block that existed, while the fence's
  // unit line already took "a terminal node id, OR a labelled edge id". Given a contradiction and no
  // slot, the operator named none of them and signed 17 of 52 units off its own diff read. Both
  // halves of the old sentence are asserted GONE, not merely superseded.
  it('VALID: served template => gives a branch and a terminal a tagged row instead of forbidding them a block', () => {
    expect({
      oldProhibition: hasIn({
        needle: 'they never appear in a `MUST BE TRUE` line',
        text: TEMPLATE,
      }),
      oldPointerAtNoBlock: hasIn({
        needle: 'name them to your sub-agents in the same brief and\nsign them like anything else',
        text: TEMPLATE,
      }),
      taggedRowsInstead: hasIn({
        needle:
          "a brief's `UNITS` block takes them anyway, as ordinary rows tagged `[branch]` and `[terminal]`",
        text: TEMPLATE,
      }),
      everyUnitReachesABrief: hasIn({
        needle:
          '**Every unit in your cell goes on some brief as a tagged row, and you sign only what comes back.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      oldProhibition: false,
      oldPointerAtNoBlock: false,
      taggedRowsInstead: true,
      everyUnitReachesABrief: true,
    });
  });

  // 2b. A `TRAPS` LINE IS A CLAIM ABOUT A LINT RULE, and the block's own instruction — "one line
  // each: a lint rule, …" — invites the operator to assert one from memory. One such assertion said
  // a rule sanctioned an import it refuses on filename alone, and the sub-agent paid for it.
  it('VALID: served template => makes a TRAPS entry name a rule the operator has read this session', () => {
    expect(
      hasIn({
        needle:
          '**A `TRAPS` entry names a rule you have READ this session, never one you remember.** A brief that\n  asserted a lint rule sanctioned an import the rule in fact refuses left its sub-agent unable to\n  tell which of the two was right.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // 2c. BOTH GROUPING CONDITIONS, WHERE THE GROUPING HAPPENS. Step 3 stated one — different files —
  // and step 4 added the dependency condition about 75 lines further down, so the operator applied
  // the first, found a real dependency between two briefs that touched different files, and papered
  // over it with a "wait and re-check" line inside the brief. It won that race by 40 seconds.
  it('VALID: served template => states both grouping conditions at step 3 and forbids a wait inside a brief', () => {
    expect({
      bothConditionsTogether: hasIn({
        needle:
          '**Two changes share a group only when BOTH hold: they touch DIFFERENT FILES, and NEITHER NEEDS THE\nOTHER to have landed.**',
        text: TEMPLATE,
      }),
      oneAloneIsTheTrap: hasIn({
        needle:
          'Both, every time. Apply only the first and you group two changes whose real\norder you then have to paper over inside the brief.',
        text: TEMPLATE,
      }),
      noWaitInABrief: hasIn({
        needle:
          '**Never write a wait into a brief.** A file another brief is creating means those two briefs belong\nin DIFFERENT GROUPS — never in one group with a "if it is not there yet, re-check" line.',
        text: TEMPLATE,
      }),
      unbounded: hasIn({
        needle: 'A wait has\nno bound, no give-up and no `wall`',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      bothConditionsTogether: true,
      oneAloneIsTheTrap: true,
      noWaitInABrief: true,
      unbounded: true,
    });
  });

  // 2d. A PLACEHOLDER THE OPERATOR WRITES ITSELF IS THE ONE NOBODY CHECKS. `<unit-id>` is covered by
  // the substitution rule above; `[<the same function predicate>]` survived into a live brief's
  // `DO`-block pseudo-code and the sub-agent had to reconstruct what it meant.
  it('VALID: served template => substitutes or deletes every angle-bracket placeholder before dispatch', () => {
    expect(
      hasIn({
        needle:
          '- **Every `<…>` in a brief is substituted or deleted before you dispatch it**, the pseudo-code in\n  your `DO` block included. One that survives is something the sub-agent has to reconstruct from\n  the code, and it reconstructs it its own way.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // 2e. THE REVIEWER DISPATCH NAMES ITS `subagent_type`. Codeweaver's line carried only the model,
  // and the sentence about there being no `.claude/agents` entry exists on flowrider because someone
  // once guessed wrong about that.
  it('VALID: served template => dispatches the reviewer as general-purpose and says no agents entry exists', () => {
    expect(
      hasIn({
        needle:
          'Dispatch your reviewer with `subagent_type: "general-purpose"` and `model: "sonnet"`, alone in its\nmessage, never beside anything else. **There is no `.claude/agents` entry for it** — every\nsub-agent here is `general-purpose`, and the served prompt is what makes it a reviewer.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // 2f. THE LOOP IS UNBOUNDED, SO NO BRIEF CAN HONESTLY BE CALLED THE LAST ONE. A live brief's
  // `PROVE` block claimed exactly that and two more code briefs followed it. The replacement needs
  // no prediction and was already true.
  it('VALID: served template => refuses to call any brief the last one and states the green-on-return rule instead', () => {
    expect({
      neverClaimsFinality: hasIn({
        needle:
          '- **Never write "this is the last brief" into one.** Your loop is unbounded, so you cannot know it,',
        text: TEMPLATE,
      }),
      theTrueThingInstead: hasIn({
        needle: "**this brief's own paths are green when it\n  returns, whatever runs after.**",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ neverClaimsFinality: true, theTrueThingInstead: true });
  });

  // A BRIEF'S `FILES` BLOCK IS WHAT THE OPERATOR COULD PLAN, and the work routinely needs one more
  // file it could not — a static holding a constant, a transformer, a contract to re-parse a branded
  // type. The permission is granted against the MAP rather than against `DO NOT TOUCH` alone: that
  // block holds only the paths the operator thought of at dispatch time, while the map holds the
  // whole grouping, so the map is what separates a file nobody owns from one another group is
  // mid-way through writing. `DO NOT TOUCH` still binds on top of it.
  it('VALID: brief template => lets the sub-agent create a file no other map group claims, and refuses it the rest', () => {
    expect({
      permission: hasIn({
        needle:
          'Create any other file the work turns out to need — a static, a transformer, a contract — WHEN the MAP below puts it in no other group.',
        text: BRIEF_TEMPLATE,
      }),
      otherGroupsRefused: hasIn({
        needle:
          "Where the map puts it in another group it is that group's: never create or edit it, and name it on the NEXT: rework line instead.",
        text: BRIEF_TEMPLATE,
      }),
      doNotTouchStillBinds: hasIn({
        needle: 'Anything under DO NOT TOUCH is the same, whatever the map says.',
        text: BRIEF_TEMPLATE,
      }),
      doNotTouchBlockKept: hasIn({
        needle: 'DO NOT TOUCH\n  <paths another sub-agent is writing right now>',
        text: BRIEF_TEMPLATE,
      }),
      returnMarksTheUnplanned: hasIn({
        needle:
          'FILES: <every path I created or changed. Mark each one this brief did not list: "(not in brief)">',
        text: BRIEF_TEMPLATE,
      }),
      operatorToldItIsNormal: hasIn({
        needle:
          '**A return naming files you did not\n  plan is the normal case**, not a sub-agent exceeding its brief',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      permission: true,
      otherGroupsRefused: true,
      doNotTouchStillBinds: true,
      doNotTouchBlockKept: true,
      returnMarksTheUnplanned: true,
      operatorToldItIsNormal: true,
    });
  });

  // THE MAP IS THE ONLY PLACE THE WHOLE GROUPING EXISTS, and until now no sub-agent was told it was
  // there. `DO NOT TOUCH` is the operator's hand-copied at-dispatch list; the map behind it says
  // which group every file belongs to. The brief carries its path and tells the sub-agent to read it
  // IN RELATION to its own item — its own group first, then the neighbours — so it can see what else
  // is being built and by whom.
  it('VALID: brief template => links the map and makes the sub-agent read it against its own group', () => {
    expect({
      mapLine: hasIn({
        needle: 'MAP\n  <absolute path of the map this brief was cut from>',
        text: BRIEF_TEMPLATE,
      }),
      readItInRelation: hasIn({
        needle:
          'Read it, and read it AGAINST your own FILES above: find the group your files sit in, then read the neighbouring groups, so you see what else is being built and by whom.',
        text: BRIEF_TEMPLATE,
      }),
      operatorPutsThePathInEveryBrief: hasIn({
        needle:
          "- **Every brief carries your map's path in its `MAP` line.** `DO NOT TOUCH` only ever holds the\n  paths you happened to think of at dispatch; the map holds the whole grouping. A sub-agent that\n  cannot see it cannot tell a file nobody owns from one another group is mid-way through writing.",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      mapLine: true,
      readItInRelation: true,
      operatorPutsThePathInEveryBrief: true,
    });
  });

  // THE OPERATOR SUBSTITUTES REAL IDS INTO `UNITS` — a live brief carried `check-elapsed-split:` and
  // `check-negative-span-clamps:` — so a `RETURN` block still reading `<unit-id>` comes back with a
  // report naming nothing the brief asked for, and nothing can be signed off it. Both halves are
  // pinned: the `RETURN` lines point back at `UNITS`, and the bare placeholder is gone from that
  // block entirely.
  it('VALID: brief template => ties the RETURN block ids back to this brief own UNITS block', () => {
    expect({
      proved: hasIn({
        needle: '<an id from UNITS above, copied exactly — one line per id> — <test file:line>',
        text: BRIEF_TEMPLATE,
      }),
      notProved: hasIn({
        needle: '<an id from UNITS above, the same way> — <why.',
        text: BRIEF_TEMPLATE,
      }),
      barePlaceholderLeftInReturn: BRIEF_TEMPLATE.slice(
        BRIEF_TEMPLATE.indexOf('\nRETURN\n'),
      ).includes('<unit-id>'),
      operatorToldToSubstitute: hasIn({
        needle:
          '**You substitute real ids into `UNITS`, and `RETURN` reports those SAME strings.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      proved: true,
      notProved: true,
      barePlaceholderLeftInReturn: false,
      operatorToldToSubstitute: true,
    });
  });

  // A CELL IS ONE PACKAGE, AND CODE TWO PACKAGES NEED BELONGS IN NEITHER OF THEM. Left unsaid, a
  // session reaches for the two moves that compile — copying the behaviour in, or importing across a
  // dependency edge the manifest does not have — so all three moves are named with their verdicts.
  it('VALID: served template => routes cross-package code through a shared home rather than a copy or a reach', () => {
    expect({
      copy: hasIn({
        needle:
          '| copy it into your package | no. The two copies drift, and your reviewer reports it as duplication. |',
        text: TEMPLATE,
      }),
      importAcross: hasIn({
        needle:
          "| import it from the sibling | only where your package's `package.json` already depends on that package. |",
        text: TEMPLATE,
      }),
      move: hasIn({
        needle:
          '| move it into a package both can call, then point both sides at the new home | yes |',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ copy: true, importAcross: true, move: true });
  });

  // ONE CALL, NOT TWO. The second `{ questId, packageName }` call existed only to reach a contract
  // no flow-scoped render showed; `questFlowSliceTransformer` now renders those under their own
  // heading, so a prompt still asking for two calls spends a whole tool result re-fetching what the
  // first one already returned. Pinned as the EXACT fenced block, because a session copies it.
  it('VALID: served template => step 1 spells out exactly ONE get-quest call', () => {
    const fenced =
      "get-quest({ questId: 'QUEST_ID', flowId: '<your flow>', packageName: '<your package>' })";

    expect({
      theCall: hasIn({ needle: fenced, text: TEMPLATE }),
      callCount: TEMPLATE.split('get-quest({ questId').length - 1,
      saysOne: hasIn({ needle: 'ONE call:', text: TEMPLATE }),
    }).toStrictEqual({ theCall: true, callCount: 2, saysOne: true });
  });

  // A SEAM NODE IS READ WHOLE, AND SIGNED IN HALF. The render prints every observable on a node
  // this package tags, its sibling's included, because the sibling half IS the spec for this half —
  // the request shape for a route this cell serves, the render its bytes have to satisfy. Measured
  // on one cell of a real quest, the old filter erased 9 of 18 lines, one of them the GET this
  // session was writing the handler for. Both halves of the rule are pinned: READ them, and sign
  // only your own — a prompt carrying the first without the second buys a verdict nothing backs.
  it('VALID: served template => step 1 tells the session to read every observable on its own nodes and sign only its own', () => {
    expect({
      readsThemAll: hasIn({
        needle:
          '**On a node marked `◀ YOURS` you see every observable on it, including the ones another package owns.**',
        text: TEMPLATE,
      }),
      theyAreTheContract: hasIn({
        needle:
          "They are the other half of the contract you are building — the client's request shape for a route you serve, the render your bytes have to satisfy. **Read them.**",
        text: TEMPLATE,
      }),
      becomesARequirement: hasIn({
        needle:
          "Where one names something your own code must do, that is a requirement on you, and your brief's `UNITS` rows should carry it.",
        text: TEMPLATE,
      }),
      signsItsOwnAlone: hasIn({
        needle: '**You still sign only the observables whose `{package}` is yours.**',
        text: TEMPLATE,
      }),
      noCollapsedCount: hasIn({
        needle: 'Observables attributed to another package are collapsed to a count',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      readsThemAll: true,
      theyAreTheContract: true,
      becomesARequirement: true,
      signsItsOwnAlone: true,
      noCollapsedCount: false,
    });
  });

  // A CONTRACT IS THE ONE PART OF A CELL NO OBSERVABLE MENTIONS, so a missing one breaks no test the
  // session runs and ships as a hole. Step 5 is where the diff is read, which is the only point the
  // session can still send work back out.
  it('VALID: served template => step 5 checks every contract landed and dispatches for any that did not', () => {
    expect({
      asksTheQuestion: hasIn({ needle: '2. **Is EVERY contract there?**', text: TEMPLATE }),
      dispatchesForMisses: hasIn({
        needle: '**Anything missing goes straight back out as a sub-agent brief.**',
        text: TEMPLATE,
      }),
      namesTheOrphans: hasIn({
        needle: 'The contracts under `NO flow of yours anchors` are the ones to check hardest',
        text: TEMPLATE,
      }),
      countUpdated: hasIn({ needle: 'Four questions, and only you can ask them', text: TEMPLATE }),
    }).toStrictEqual({
      asksTheQuestion: true,
      dispatchesForMisses: true,
      namesTheOrphans: true,
      countUpdated: true,
    });
  });

  // THE SHARED PACKAGE'S NAME CANNOT BE WRITTEN DOWN HERE — every repo picks its own (`shared`,
  // `shared-core`, `shared-ui`), so the prompt sends the session to `get-project-map` and has it
  // match on the `[library]` KIND, which is the one property every repo's version shares. The
  // replaced-whole warning is what stops a session clearing `packagesAffected` while adding one
  // entry to it.
  it('VALID: served template => finds the shared package by KIND through get-project-map, never by a name of its own', () => {
    expect({
      pointsAtTheTool: hasIn({
        needle: '**`get-project-map` names the candidates.**',
        text: TEMPLATE,
      }),
      matchesOnKind: hasIn({
        needle:
          'Every repo calls that package something different —\n`shared`, `shared-core`, `shared-ui` — so look for the KIND rather than the name: a package the map\nlabels `[library]` is one every other package may depend on.',
        text: TEMPLATE,
      }),
      whenTheRepoHasNone: hasIn({
        needle:
          '**A repo with no library package at all leaves you the second row of that table**, not the third',
        text: TEMPLATE,
      }),
      replacedWholeTrap: hasIn({
        needle:
          '**It is REPLACED WHOLE on write.** Send back every entry already\nthere plus your new one, or the write drops the rest.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      pointsAtTheTool: true,
      matchesOnKind: true,
      whenTheRepoHasNone: true,
      replacedWholeTrap: true,
    });
  });

  // THE MANIFEST EDIT IS THE HALF OF A MOVE NOTHING WOULD REPORT MISSING. The root `node_modules`
  // resolves a sibling package whether or not the importing one declares it, so the pass stays green
  // and the package breaks when it is installed alone.
  it('VALID: served template => makes the moving session add the package.json dependency the move needs', () => {
    expect(
      hasIn({
        needle:
          "**Put the dependency in your package's `package.json` where it is not already there.** The\n  workspace's root `node_modules` resolves the import without it, so nothing you run turns red and\n  the package breaks the day it is installed on its own.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // SIBLING CELLS COMMIT AS THEY FINISH AND THE LIBRARY TIER RUNS FIRST, so the helper this cell is
  // about to brief may already be on the branch. Reading the branch before planning is what turns
  // that into a reuse instead of a second copy.
  it('VALID: served template => reads what the earlier cells committed before it plans', () => {
    expect({
      commands: hasIn({
        needle: 'git log --oneline -n 20\ngit log --name-only -n 10',
        text: TEMPLATE,
      }),
      why: hasIn({
        needle:
          'The ledger runs the library packages first and every cell commits as it finishes, so a helper yours\nneeds may already be on this branch',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ commands: true, why: true });
  });

  // A BRIEF THAT LEAVES SOMETHING OUT PRODUCES A CHANGE THAT LEAVES IT OUT TOO, so the dispatch
  // shape — the exact type and model — is pinned rather than left to a session's judgement.
  it('VALID: served template => dispatches a sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE REVIEWER'S BRIEF NAMES ITS OWN PROMPT AND CARRIES NO `workItemId` — a sub-agent holding this
  // session's work item id could signal on it and complete the work early.
  it('VALID: served template => briefs the reviewer via get-agent-prompt naming codeweaver-reviewer with no workItemId', () => {
    expect({
      fetchLine: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'codeweaver-reviewer', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle:
          '**That fetch carries no `workItemId`. Never add yours.** A sub-agent holding your work item id could\nsignal on it and complete your work while you are still running.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fetchLine: true, neverAddYours: true });
  });

  // THE ORCHESTRATOR OWNS THE LEDGER; THIS SESSION ONLY REPORTS AN OUTCOME ON IT — `operationStatus`
  // is what carries that outcome on the one `signal-back` call this role ever makes.
  it('VALID: served template => signals complete carrying operationStatus done or blocked', () => {
    expect({
      done: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
        text: TEMPLATE,
      }),
      blocked: hasIn({
        needle: "operationStatus: 'blocked', blockedReason:",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ done: true, blocked: true });
  });

  // THIS ROLE READS CODE AND JUDGES A DIFF; IT NEITHER GRADES A TEST SUITE NOR THE STANDING
  // CONCERNS. Neither shared reviewer block belongs here — only `codeweaver-reviewer` takes one.
  it('VALID: served template => carries none of the three shared reviewer/authoring blocks', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: false, authoring: false, standards: false });
  });

  // THE ROUND PROTOCOL IS GONE FROM THIS ROLE. This operator scripts its own steps directly rather
  // than dispatching a planner/worker/reviewer trio over a shared round document, so none of that
  // vocabulary — nor a sibling operation-owning role's name — belongs in its text.
  it('VALID: served template => carries no round-protocol or sibling-role vocabulary', () => {
    expect({
      roundDocument: hasIn({ needle: 'round document', text: TEMPLATE }),
      plannerMinion: hasIn({ needle: 'planner-minion', text: TEMPLATE }),
      workerMinion: hasIn({ needle: 'worker-minion', text: TEMPLATE }),
      groundstomper: hasIn({ needle: 'groundstomper', text: TEMPLATE }),
      pesteater: hasIn({ needle: 'pesteater', text: TEMPLATE }),
      blightLedger: hasIn({ needle: 'blightLedger', text: TEMPLATE }),
      getBlightChecklist: hasIn({ needle: 'get-blight-checklist', text: TEMPLATE }),
      getPlannerInformation: hasIn({ needle: 'get-planner-information', text: TEMPLATE }),
      getWorkerInformation: hasIn({ needle: 'get-worker-information', text: TEMPLATE }),
      getReviewerInformation: hasIn({ needle: 'get-reviewer-information', text: TEMPLATE }),
      phases: hasIn({ needle: 'PHASES', text: TEMPLATE }),
      waves: hasIn({ needle: 'WAVES', text: TEMPLATE }),
    }).toStrictEqual({
      roundDocument: false,
      plannerMinion: false,
      workerMinion: false,
      groundstomper: false,
      pesteater: false,
      blightLedger: false,
      getBlightChecklist: false,
      getPlannerInformation: false,
      getWorkerInformation: false,
      getReviewerInformation: false,
      phases: false,
      waves: false,
    });
  });
});
