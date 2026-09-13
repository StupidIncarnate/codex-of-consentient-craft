import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { flowriderPromptStatics } from './flowrider-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides before it
// matches, so re-flowing a paragraph reds nothing that is still true.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderPromptStatics.prompt.template;

// THE FENCED BRIEF TEMPLATE IS THE ONLY PART A SUB-AGENT EVER READS — the operator copies it into an
// `Agent` call and everything around it stays in the operator's own context. So a needle found
// anywhere in the whole prompt proves nothing about what the sub-agent was told, and every rule a
// sub-agent has to obey is asserted against this slice instead.
const BRIEF_TEMPLATE_START = TEMPLATE.indexOf('\nFILES\n');
const BRIEF_TEMPLATE = TEMPLATE.slice(
  BRIEF_TEMPLATE_START,
  TEMPLATE.indexOf('\n```', BRIEF_TEMPLATE_START),
);

describe('flowriderPromptStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## Operation Context\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: flowriderPromptStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  // MEASURED WITH `authoringMarkdown` ALREADY INTERPOLATED — the served template carries no further
  // substitution, so `TEMPLATE` here IS the resolved text the MCP layer weighs.
  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // `authoringMarkdown` OPENS WITH ITS OWN `##` HEADING, so the interpolation adds one section to
  // this list that the source file itself never writes — a rename inside the shared block reds this
  // test exactly as a rename inside this file would.
  it('VALID: served template => names its twelve top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## The words this page uses',
      '## What you do, and what you never do',
      '## Operating rules',
      '## Your tools',
      '## The script',
      '## Modality — chosen per OBSERVABLE, never per flow',
      '## Proving something in the browser',
      '## Proving something below the browser',
      "## Reading a sub-agent's return",
      '## Briefing a sub-agent',
      '## Recording what you claim',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its ten script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Fetch your flow',
      '### 2. Get the full list of units',
      '### 3. Read the implementation, and choose a layer per unit',
      '### 4. Write your map',
      '### 5. Send the tests out',
      '### 6. Read what was written',
      '### 7. Run your reviewer',
      '### 8. Pass, or go round again',
      '### 9. Record what you claim, and what you found',
      '### 10. Signal',
    ]);
  });

  it('VALID: served template => lists the reviewer sweep and the bare ward under NOT YOURS', () => {
    expect(
      hasIn({
        needle:
          'NOT YOURS Edit / Write on any path but your map sub-agents write tests, not you ScheduleWakeup / ListAgents / any timer the notification IS the wake, see [HELPERS] npm run ward -- --uncommitted see [WARD SCOPE] npm run ward (bare) see [WARD SCOPE]',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it("VALID: served template => routes the reviewer's NEXT: line through exactly pass, rework and wall", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | go to step 9 |', text: TEMPLATE }),
      rework: hasIn({
        needle:
          '| `rework` | go back to step 5 and send out exactly what it named. **Any unit it named that you already signed: overwrite that sign-off from the new `PROVED` line, or clear it with `flowriderSignoff: null`.** A `confirmed` your reviewer just rejected is the one thing that must not survive the loop. |',
        text: TEMPLATE,
      }),
      wall: hasIn({ needle: '| `wall` | go to step 9 and signal `blocked` |', text: TEMPLATE }),
      noCap: hasIn({
        needle: '**There is no cap. Keep going until your reviewer says `pass`.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ pass: true, rework: true, wall: true, noCap: true });
  });

  it("VALID: served template => reads a sub-agent's return and treats a missing NEXT: line as rework", () => {
    expect({
      pass: hasIn({ needle: '| `pass` | move on |', text: TEMPLATE }),
      rework: hasIn({
        needle: '| `rework` | it could not finish. Read what is left, and send that out again. |',
        text: TEMPLATE,
      }),
      wall: hasIn({
        needle:
          '| `wall` | stop sending work out. Let anything running finish, then go to step 9. |',
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
        text: TEMPLATE,
      }),
      namesWhyOwnPathsOnly: hasIn({
        needle:
          'Each sub-agent you dispatch runs ward on its own files and\nnothing wider: `npm run ward -- -- <its own paths>`',
        text: TEMPLATE,
      }),
      neverWidens: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: TEMPLATE,
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

  // THE SUB-AGENT HOLDS THE `run-ward` MCP TOOL ITSELF, and a brief that only names a Bash line is
  // not a refusal of it. Measured on the sibling codeweaver track, five of ten sub-agents reached
  // for the tool first, called it with `{}`, and spent a turn recovering from a validation dump
  // naming three fields their brief never gave them. The operator-facing bullet explaining why sits
  // OUTSIDE the fence, so the session that needed it never read it — which is why this asserts on
  // the fenced slice: the whole prompt carries that bullet and would go green over a brief that
  // says nothing.
  it('VALID: brief template => names the exact two-token ward command and refuses the run-ward MCP tool, both under PROVE inside the fence', () => {
    expect({
      imperativeExactCommand: hasIn({
        needle:
          "Call THIS EXACT command to prove your own work:\n  `npm run ward -- -- <this brief's own paths>`",
        text: BRIEF_TEMPLATE,
      }),
      twoTokensSpeltOut: hasIn({
        needle:
          'Two separate `--` tokens — that is the real invocation, and one token is a different command.',
        text: BRIEF_TEMPLATE,
      }),
      refusesTheMcpTool: hasIn({
        needle:
          '**NEVER the run-ward MCP tool.** Different command: it grades the whole branch, and it wants a quest id and a work item id you were not given, so reaching for it spends a turn on a validation error. Call the Bash line above.',
        text: BRIEF_TEMPLATE,
      }),
      underThePROVEHeading:
        BRIEF_TEMPLATE.indexOf('NEVER the run-ward MCP tool') > BRIEF_TEMPLATE.indexOf('\nPROVE\n'),
      ownPathsLineKept: hasIn({
        needle:
          '**YOUR OWN PATHS AND NOTHING WIDER. NEVER --uncommitted. NEVER a bare ward. NEVER commit.**',
        text: BRIEF_TEMPLATE,
      }),
      discoveryMismatchLineKept: hasIn({
        needle:
          'DISCOVERY MISMATCH on a check type = ward answering, not failing. --passWithNoTests is never the fix.',
        text: BRIEF_TEMPLATE,
      }),
      operatorBulletSaysWhyTheFenceRepeatsIt: hasIn({
        needle:
          '**The `run-ward` MCP tool is not the same command.** It grades the whole branch and lands the red\n  on your work item, and the fence above repeats that refusal because your sub-agent holds that tool\n  too and reaches for it before the Bash line you named.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      imperativeExactCommand: true,
      twoTokensSpeltOut: true,
      refusesTheMcpTool: true,
      underThePROVEHeading: true,
      ownPathsLineKept: true,
      discoveryMismatchLineKept: true,
      operatorBulletSaysWhyTheFenceRepeatsIt: true,
    });
  });

  // A BRIEF IS A GUESS MADE WITHOUT THE CODE OPEN, and the sub-agent is the session that finds out.
  // Both halves are pinned together because the permission alone does damage: on the audited
  // codeweaver pass a sub-agent swapped a status comparison for a guard matching a wider set,
  // shipped a real defect, and reported the swap in a `FILES:` footnote under `NEXT: pass`. Asserted
  // on the fenced slice — the operator never reads its own brief back, so a rule outside the fence
  // reaches nobody who could act on it.
  it('VALID: brief template => lets hard evidence beat a direction, and reports every deviation as NOT PROVED or rework', () => {
    const betweenPROVEAndRETURN = BRIEF_TEMPLATE.slice(
      BRIEF_TEMPLATE.indexOf('\nPROVE\n'),
      BRIEF_TEMPLATE.indexOf('\nRETURN\n'),
    );

    expect({
      directionsAreABestGuess: hasIn({
        needle:
          'These directions are a best guess, made across a whole file set that proves one flow. You have\n  the code open and the session that wrote them does not.',
        text: BRIEF_TEMPLATE,
      }),
      hardEvidenceWins: hasIn({
        needle:
          'Where you find HARD EVIDENCE against a direction —\n  the value under ASSERT is not what the implementation returns, the SURFACE cannot reach the\n  unit — the evidence wins, and you follow the evidence.',
        text: BRIEF_TEMPLATE,
      }),
      deviationReportsAsAFailure: hasIn({
        needle:
          '**Report every deviation under NOT PROVED, or on the NEXT: rework line. Never as a note beside\n  NEXT: pass.**',
        text: BRIEF_TEMPLATE,
      }),
      reasonGivenInOneClause: hasIn({
        needle:
          'This brief was written against the flow rather than the code in front of you, so a swap nobody is\n  told about is a change nobody reviewed.',
        text: BRIEF_TEMPLATE,
      }),
      sitsBetweenPROVEAndRETURN: betweenPROVEAndRETURN.includes('\nIF THIS BRIEF IS WRONG\n'),
    }).toStrictEqual({
      directionsAreABestGuess: true,
      hardEvidenceWins: true,
      deviationReportsAsAFailure: true,
      reasonGivenInOneClause: true,
      sitsBetweenPROVEAndRETURN: true,
    });
  });

  // A `FILES` BLOCK IS WHAT THE OPERATOR COULD PLAN, and a spec routinely needs one more file it
  // could not — a fixture, a harness helper, a stub. The operator's map is the only place the
  // grouping is written down, so a sub-agent that never sees it cannot tell a file nobody owns from
  // one another group is mid-way through writing, and the two answers left to it are inventing its
  // own rule or stopping. `DO NOT TOUCH` stays the explicit at-dispatch list; the map is the wider
  // check behind it. Asserted on the fenced slice — the operator already knows where its own map is.
  it('VALID: brief template => hands the sub-agent the map path, and scopes creating an unlisted file by that map', () => {
    expect({
      mapPath: hasIn({
        needle: ".quest-plans/<operationItemId>-map.md — your files are in <this brief's group>.",
        text: BRIEF_TEMPLATE,
      }),
      readInRelationToItsOwnGroup: hasIn({
        needle:
          'read it IN RELATION to your own files: find your\n  group, then read the groups around it, so you know what else is being built right now and\n  which sub-agent holds it.',
        text: BRIEF_TEMPLATE,
      }),
      createsWhatTheMapLeavesUnowned: hasIn({
        needle:
          'Create any other file the work turns out to need — a fixture, a helper, a stub — WHEN the\n  map puts it in no other group.',
        text: BRIEF_TEMPLATE,
      }),
      refusesAnotherGroupsFile: hasIn({
        needle:
          'Where the map puts it in another group, never create or edit\n  it, and name it on the NEXT: rework line instead.',
        text: BRIEF_TEMPLATE,
      }),
      doNotTouchBlockKept: BRIEF_TEMPLATE.includes('\nDO NOT TOUCH\n'),
      returnReportsEveryPath: hasIn({
        needle:
          'FILES: <every path I created or changed. Mark each one this brief did not list:\n   "(not in brief)">',
        text: BRIEF_TEMPLATE,
      }),
      operatorPutsTheMapPathInEveryBrief: hasIn({
        needle:
          "**Every brief carries your map's path.** A sub-agent that cannot see the grouping cannot tell a\nfile nobody owns from one another group is mid-way through writing.",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      mapPath: true,
      readInRelationToItsOwnGroup: true,
      createsWhatTheMapLeavesUnowned: true,
      refusesAnotherGroupsFile: true,
      doNotTouchBlockKept: true,
      returnReportsEveryPath: true,
      operatorPutsTheMapPathInEveryBrief: true,
    });
  });

  // THE DECISION IS THE OPERATOR'S ALONE, and the fenced slice is where it must NOT be. Measured: a
  // live flowrider sent an explorer after "web e2e infrastructure", the explorer built 103,000 tokens
  // of context and returned `packages/web/playwright.config.ts` with its whole body quoted — a file
  // the operator could have named itself, so it was paid for three times where one `Read` pays once,
  // and the search that justified delegating was thrown away. Step 3 offered no route for "how is e2e
  // set up here", so the session invented the explorer and its brief together. `notInTheBriefSlice`
  // is what proves the fix landed on the operator: a delegation rule inside the fence reaches only
  // sub-agents, and reads to them as permission to delegate again.
  it('VALID: served template => sends an explorer only where the search is large and the answer small, and keeps that rule out of the brief', () => {
    const stepThree = TEMPLATE.slice(
      TEMPLATE.indexOf('### 3. Read the implementation'),
      TEMPLATE.indexOf('### 4. Write your map'),
    );
    const decisionRule = '**Delegate when the SEARCH is large and the ANSWER is small.**';

    expect({
      decisionRule: hasIn({ needle: decisionRule, text: TEMPLATE }),
      searchStaysOutOfContext: hasIn({
        needle:
          '"Which file in this repo fixes the e2e\nport" earns an explorer: a path and a line come back, and the reading it took stays out of your own\ncontext, which is the whole benefit.',
        text: TEMPLATE,
      }),
      aNamedFileIsReadNotDelegated: hasIn({
        needle:
          '**Where you already know the file, `Read` it** — an explorer\nsent for a path you have already named is a `Read` with two extra hops and triple the tokens.',
        text: TEMPLATE,
      }),
      testInfrastructureIsSuchASearch: hasIn({
        needle:
          'How\nthis repo configures e2e, what the harness expects, what already exists to reuse are that same large\nsearch, and go out the same way, briefed as the question and nothing more.',
        text: TEMPLATE,
      }),
      whereTheLayerIsChosen: hasIn({ needle: decisionRule, text: stepThree }),
      notInTheBriefSlice: hasIn({ needle: decisionRule, text: BRIEF_TEMPLATE }),
    }).toStrictEqual({
      decisionRule: true,
      searchStaysOutOfContext: true,
      aNamedFileIsReadNotDelegated: true,
      testInfrastructureIsSuchASearch: true,
      whereTheLayerIsChosen: true,
      notInTheBriefSlice: false,
    });
  });

  it('VALID: served template => dispatches a sub-agent with subagent_type general-purpose and model sonnet', () => {
    expect(
      hasIn({
        needle: 'Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => briefs the reviewer via get-agent-prompt naming flowrider-reviewer with no workItemId', () => {
    expect({
      fetchLine: hasIn({
        needle:
          "Call get-agent-prompt({ agent: 'flowrider-reviewer', questId: 'QUEST_ID' }) FIRST, then follow what it returns exactly.",
        text: TEMPLATE,
      }),
      neverAddYours: hasIn({
        needle:
          '**That fetch carries no `workItemId`. Never add yours.** A sub-agent holding your work item id could\nsignal on it and complete your work while you are still running.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fetchLine: true, neverAddYours: true });
  });

  it('VALID: served template => signals complete carrying operationStatus done or blocked', () => {
    expect({
      done: hasIn({
        needle:
          "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
        text: TEMPLATE,
      }),
      blocked: hasIn({ needle: "operationStatus: 'blocked', blockedReason:", text: TEMPLATE }),
    }).toStrictEqual({ done: true, blocked: true });
  });

  // THIS PROMPT TAKES THE AUTHORING HALF OF THE EVIDENCE CONTRACT — it chooses the layer per unit and
  // briefs sub-agents against that choice — and NEITHER the judging half (that is its reviewer's) NOR
  // the standing concerns (also its reviewer's, never the author's).
  it('VALID: served template => carries the authoring evidence contract and withholds judging and standards', () => {
    expect({
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ authoring: true, judging: false, standards: false });
  });

  // THREE PASSAGES DECIDE WHETHER BROWSER WALKS GO OUT TOGETHER, and they must agree: the map
  // template's GROUP 2 label, the grouping rule at step 4, and the sending rule at step 5. Any one
  // of them left telling the flowrider to send browser walks alone collapses every group in
  // packages/web into a single-file chain, because every unit on a web flow lives in one package.
  it('VALID: served template => sends browser walks against one package together, capped at four', () => {
    expect({
      groupTwoTakesTheNextFiles: hasIn({
        needle: 'GROUP 2  (the next files, sent once every file in group 1 has come back)',
        text: TEMPLATE,
      }),
      groupingRuleCapsAtFour: hasIn({
        needle: 'at most four browser walks in one group',
        text: TEMPLATE,
      }),
      sendingRuleAllowsTogether: hasIn({
        needle: 'Browser walks against the same package DO go out together, up to four at a time.',
        text: TEMPLATE,
      }),
      forbidsTwoAtOnce: hasIn({
        needle: 'never two browser walks against the same package',
        text: TEMPLATE,
      }),
      demandsOwnGroupEach: hasIn({
        needle: 'Give each browser walk its own group',
        text: TEMPLATE,
      }),
      claimsOneReportPathPerPackage: hasIn({
        needle: 'Playwright writes one report path per package',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      groupTwoTakesTheNextFiles: true,
      groupingRuleCapsAtFour: true,
      sendingRuleAllowsTogether: true,
      forbidsTwoAtOnce: false,
      demandsOwnGroupEach: false,
      claimsOneReportPathPerPackage: false,
    });
  });

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

  // DEPTH STOPS AT THE SUB-AGENT, and until this landed nothing in this prompt said so at any
  // level. Measured on the sibling codeweaver track: a sub-agent whose brief asserted a lint
  // permission the repo's own rule refuses could not tell which of the two was right, dispatched an
  // `Explore` agent of its own to find out, and deviated silently on what came back. The cost is
  // bounded here and unbounded one level further out — a fixer that let its own sub-agent go
  // looking spawned ten `Explore` grandchildren and burned roughly 4.5 million context tokens on a
  // single fix, which is the incident `siegemaster-verifier` and `siegemaster-stress` both cite.
  //
  // Asserted against the FENCE, because the operator's own text licenses exactly this move one
  // level up: a whole-prompt needle would go green over a brief that says nothing.
  it('VALID: brief template => reaches for discovery only where the brief falls short, and dispatches nothing below it', () => {
    expect({
      briefFirst: hasIn({
        needle:
          'This brief is meant to be enough. FILES, FACTS, FENCES, SURFACES, UNITS and MIRROR carry what the operator already paid to find, so read them and start writing.',
        text: BRIEF_TEMPLATE,
      }),
      namesWhatNotEnoughMeans: hasIn({
        needle:
          'Reach for the discover tool only where one of them leaves you unable to work: a name you cannot resolve, a shape the MIRROR does not show, a FACT the file contradicts.',
        text: BRIEF_TEMPLATE,
      }),
      aSurfaceIsNeverReDerived: hasIn({
        needle: 'a SURFACE is never yours to re-derive at all',
        text: BRIEF_TEMPLATE,
      }),
      mapStillOpensIt: hasIn({
        needle:
          'When you do reach for it, open with get-project-map({ packages: [<every package your files above touch>] }).',
        text: BRIEF_TEMPLATE,
      }),
      mandatoryWordingGone: BRIEF_TEMPLATE.includes('Do your OWN discovery'),
      refusesToDelegateExploring: hasIn({
        needle: '**Never dispatch a sub-agent to explore.**',
        text: BRIEF_TEMPLATE,
      }),
      saysWhyItIsWorthKeeping: hasIn({
        needle: "found lands in someone else's summary instead of in the session writing the test",
        text: BRIEF_TEMPLATE,
      }),
      namesItsOwnLevel: hasIn({
        needle:
          'You sit one level below the operator that briefed you, and nothing goes below you.',
        text: BRIEF_TEMPLATE,
      }),
    }).toStrictEqual({
      briefFirst: true,
      namesWhatNotEnoughMeans: true,
      aSurfaceIsNeverReDerived: true,
      mapStillOpensIt: true,
      mandatoryWordingGone: false,
      refusesToDelegateExploring: true,
      saysWhyItIsWorthKeeping: true,
      namesItsOwnLevel: true,
    });
  });

  // A BRIEF THAT PASTES A SECTION OF THE OPERATOR'S OWN PAGE PAYS THAT COST ONCE PER BRIEF, WHERE THE
  // MAP PAYS IT ONCE PER FLOW. Measured across twelve real briefs from one flow, the pasted block ran
  // roughly 13,000 characters over six of them, and about 17 lines in 44 restated
  // `get-testing-patterns`, which every sub-agent calls for itself. The three `indexOf(...) === -1`
  // entries are what prove the paste is GONE rather than merely joined by a shorter form beside it —
  // a `hasIn` on the new `KIND` line alone goes green over a brief still carrying both.
  it('VALID: brief template => names its test KIND in one word and points at the map, pasting no rules block of its own', () => {
    expect({
      pastedBlockHeadingGone: BRIEF_TEMPLATE.indexOf('\nHOW TO WRITE THESE\n'),
      pastedInstructionGone: BRIEF_TEMPLATE.indexOf(
        'the rules from the matching section of this page, pasted',
      ),
      hasNotReadThatSectionGone: BRIEF_TEMPLATE.indexOf('The sub-agent has not read that section'),
      kindIsOneWord: hasIn({
        needle:
          "KIND\n  <browser | below-browser — one word, this file's test kind and nothing else.",
        text: BRIEF_TEMPLATE,
      }),
      kindPointsAtTheMap: hasIn({
        needle:
          'The rules for writing that kind are in the MAP above, under its `HOW TO WRITE THESE` heading. Read the half that matches this word before you write a line.',
        text: BRIEF_TEMPLATE,
      }),
      mapTemplateCarriesBothHalvesOnce: hasIn({
        needle:
          'HOW TO WRITE THESE\n  browser        <- `## Proving something in the browser`, written out in full, once\n  below-browser  <- `## Proving something below the browser`, written out in full, once',
        text: TEMPLATE,
      }),
      operatorWritesThemOnce: hasIn({
        needle: "**Write both kinds' rules into the map ONCE, under `HOW TO WRITE THESE`.**",
        text: TEMPLATE,
      }),
      measurementGiven: hasIn({
        needle:
          'roughly 13,000 characters over six of them, of which about 17 lines in 44 restated `get-testing-patterns`, which every sub-agent calls for itself.',
        text: TEMPLATE,
      }),
      browserSectionStillTheOperatorsReference: hasIn({
        needle:
          'A browser walk is a Playwright `.e2e.ts` spec. Write these into your map ONCE, under `HOW TO WRITE THESE`; a brief names the kind and reads them there.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      pastedBlockHeadingGone: -1,
      pastedInstructionGone: -1,
      hasNotReadThatSectionGone: -1,
      kindIsOneWord: true,
      kindPointsAtTheMap: true,
      mapTemplateCarriesBothHalvesOnce: true,
      operatorWritesThemOnce: true,
      measurementGiven: true,
      browserSectionStillTheOperatorsReference: true,
    });
  });

  // A LINE NUMBER IS AN ANCHOR THAT MOVES. Measured across twelve flowrider briefs, 34 of 34 line
  // anchors resolved — and only because that operator sequenced every dependent worker and
  // hand-re-anchored `:137` to `:152` between sessions after its own fix grew the file. Neither of
  // those survives sub-agents editing one tree at the same time. `FENCES` is the one block where a
  // stale anchor costs more than a failed read: every other block fails to find what it names, while
  // a misplaced fence hands a sub-agent's own unit to a group that was never asked to write it.
  it('VALID: served template => anchors a brief and a map on a NAME', () => {
    expect({
      briefRule: hasIn({
        needle: '**Never write a line number into a brief, in any block.**',
        text: TEMPLATE,
      }),
      mapRule: hasIn({
        needle:
          '**Never a line number, here or in a brief.** Groups land in order and each one writes files, so a number recorded at map time is wrong by the group that reads it. Anchor on a NAME.',
        text: TEMPLATE,
      }),
      measurementGiven: hasIn({
        needle:
          'Measured across twelve flowrider briefs, 34 of 34 line anchors resolved — and only because that operator sequenced every dependent worker and hand-re-anchored `:137` to `:152` between sessions after its own fix grew the file.',
        text: TEMPLATE,
      }),
      namesWhatToAnchorOn: hasIn({
        needle:
          "Anchor on a NAME — an export, a const, a prop, a test case's own title. A name survives an edit, and `discover` finds it in one call.",
        text: TEMPLATE,
      }),
      fencesNamedAsTheWorstCase: hasIn({
        needle:
          '**`FENCES` is where this bites hardest**: every other block loses a stale anchor by failing to find it, while a fence that lands on the wrong region tells a sub-agent its own work is somebody else’s and leaves the unit unwritten.'.replace(
            '’',
            "'",
          ),
        text: TEMPLATE,
      }),
      brokenLineWordingGone: BRIEF_TEMPLATE.indexOf('Break the ONE line the test guards'),
      returnLineWordingGone: BRIEF_TEMPLATE.indexOf('Name that file and line in the return.'),
    }).toStrictEqual({
      briefRule: true,
      mapRule: true,
      measurementGiven: true,
      namesWhatToAnchorOn: true,
      fencesNamedAsTheWorstCase: true,
      brokenLineWordingGone: -1,
      returnLineWordingGone: -1,
    });
  });

  // A RED IS PRODUCED BY EDITING THE SPEC'S OWN ASSERTION, never by touching the implementation a
  // codeweaver session wrote and the sibling flowriders are reading. Measured on quest 1dac5395,
  // whose briefs carried the earlier break-the-construct wording: four sub-agents mutated
  // `subagent-chain-widget.tsx` inside two minutes, one restored another's live break mid-capture
  // (`the widget file was reverted by something outside my control`), one read a sibling's
  // `RED_TEST_BREAK` placeholder as product code, one reported `a clean, uncontaminated RED capture
  // was not obtained`, and one ran the whole RED FIRST pass twice across a 43-minute session.
  it('VALID: brief template => produces a red from the spec own FAILS IF value, and touches no file it does not own', () => {
    expect({
      failsIfValueIsTheLever: hasIn({
        needle:
          'RED FIRST\n  Write the spec with every unit assertion set to its FAILS IF value, and run it.',
        text: BRIEF_TEMPLATE,
      }),
      receivedValueIsTheProof: hasIn({
        needle:
          "Every one of those expects must FAIL, and each failure must report this unit's ASSERT value as what it RECEIVED.",
        text: BRIEF_TEMPLATE,
      }),
      preconditionsStayTrue: hasIn({
        needle:
          'Set only the assertions that SETTLE a unit. A precondition — the page reached, the panel visible, the row present — stays true, because a precondition that fails stops the test before the assertions that matter ever run.',
        text: BRIEF_TEMPLATE,
      }),
      compileErrorIsNotARed: hasIn({
        needle:
          'A suite that never RAN has produced no red. `Cannot find module`, `Test suite failed to run` and every `error TS` are compile failures with no assertion behind them: fix them and run again, and never report one as a red.',
        text: BRIEF_TEMPLATE,
      }),
      everyEvasionBannedByName: hasIn({
        needle:
          'You produce a red by editing YOUR OWN SPEC and nothing else. The implementation belongs to the sessions that wrote it and to the siblings reading it right now. Banned, by name: moving, copying or renaming any file; git stash; rewriting a file from git show; a `.bak` file; editing an implementation file to break it.',
        text: BRIEF_TEMPLATE,
      }),
      breakTheConstructWordingGone: BRIEF_TEMPLATE.includes('Break the ONE CONSTRUCT the test'),
      revertingAnImplementationNoLongerAsked: BRIEF_TEMPLATE.includes('put it back BY EDITING IT'),
    }).toStrictEqual({
      failsIfValueIsTheLever: true,
      receivedValueIsTheProof: true,
      preconditionsStayTrue: true,
      compileErrorIsNotARed: true,
      everyEvasionBannedByName: true,
      breakTheConstructWordingGone: false,
      revertingAnImplementationNoLongerAsked: false,
    });
  });

  // FACTS AND FENCES ARE THE TWO BLOCKS ONLY THE OPERATOR CAN SUPPLY, and the MAP is where they have
  // to live: a fact or a fence authored inside a brief exists in one sub-agent's context and nowhere
  // else, so the reviewer, a sibling flowrider on another flow and the next `pt N` session all miss
  // it. Written onto the map it is durable, and a brief becomes a SLICE of the map rather than a
  // place facts are authored. Both wordings are taken from live flowrider briefs that carried them ad
  // hoc: `THE DEFECT — already traced for you, by the session that wrote the spec`, and a fence
  // naming the sub-agent working on the same file right now. Keyed by PATH, one line each, matching
  // the sibling codeweaver map exactly — parity across the three operator roles is what stops a
  // sub-agent having to learn a different brief shape per role.
  it('VALID: served template => defines FACTS and FENCES once in the map, keyed by path', () => {
    expect({
      factsMapEntry: hasIn({
        needle:
          'FACTS\n  <path>  <one line: something true about that file already, anchored on a NAME>',
        text: TEMPLATE,
      }),
      fencesMapEntry: hasIn({
        needle:
          "FENCES\n  <path>  <one line: a part of that file that is NOT its group's, and whose it is>",
        text: TEMPLATE,
      }),
      writtenOnceAndCutFromThere: hasIn({
        needle:
          '**`FACTS` and `FENCES` are written HERE, once, and CUT into briefs from here.** Both are keyed by PATH, one line each.',
        text: TEMPLATE,
      }),
      namesWhoElseReadsTheMap: hasIn({
        needle:
          "A fact or a fence authored inside a brief lives in one sub-agent's context and nowhere else; on the map your reviewer reads it, so does a sibling flowrider on another flow, and so does the `pt N` session that picks this item up after you.",
        text: TEMPLATE,
      }),
      factDefinitionTakesTheTracedDefect: hasIn({
        needle:
          'A **FACT** is something already TRUE about that file which bears on the test — the defect, already traced for you by the session that wrote the spec;',
        text: TEMPLATE,
      }),
      factBoundedByWhatItAlreadyReads: hasIn({
        needle:
          "Write only what a sub-agent cannot already get: it reads `get-architecture`, `get-testing-patterns`, `get-folder-detail` for its folder types and every session snippet, and it has that file's own `SURFACES` and `UNITS`. A FACT restating any of those spends a brief and teaches nothing.",
        text: TEMPLATE,
      }),
      fenceDefinitionNamesTheHolder: hasIn({
        needle:
          'A **FENCE** is a part of a file some group DOES touch that is not that group\'s work, and whose it is — "one other sub-agent is working right now on the `wireHarnessLifecycle` export in <path>: read it, never edit it"',
        text: TEMPLATE,
      }),
      fenceIsTheOperatorsAlone: hasIn({
        needle: 'A fence is a boundary only you can draw, because you split the groups.',
        text: TEMPLATE,
      }),
      fenceIsNarrowerThanDoNotTouch: hasIn({
        needle:
          "A brief's `DO NOT TOUCH` fences whole FILES; this fences parts of a file a brief is editing.",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      factsMapEntry: true,
      fencesMapEntry: true,
      writtenOnceAndCutFromThere: true,
      namesWhoElseReadsTheMap: true,
      factDefinitionTakesTheTracedDefect: true,
      factBoundedByWhatItAlreadyReads: true,
      fenceDefinitionNamesTheHolder: true,
      fenceIsTheOperatorsAlone: true,
      fenceIsNarrowerThanDoNotTouch: true,
    });
  });

  // A DEFINITION KEPT IN TWO PLACES IS HOW THE TWO DRIFT APART, so the brief carries the LINES and
  // the map carries the meaning. The four `indexOf(...) === -1` entries are the whole point of this
  // pin: a brief that re-states the definitions would satisfy every positive needle above while
  // re-creating the duplication, and only an absence check catches that. Asserted on the fenced
  // slice, because the brief is the only part a sub-agent ever reads.
  it('VALID: brief template => cuts its FACTS and FENCES from the map rather than defining them again', () => {
    expect({
      factsIsASlice: hasIn({
        needle:
          "FACTS\n  <the map's FACTS lines for this brief's own files, copied — path first, one line each.",
        text: BRIEF_TEMPLATE,
      }),
      fencesIsASlice: hasIn({
        needle:
          "FENCES\n  <the map's FENCES lines for this brief's own files, copied — path first, one line each.",
        text: BRIEF_TEMPLATE,
      }),
      fencesStillSeparatesItselfFromDoNotTouch: hasIn({
        needle: 'DO NOT TOUCH fences whole FILES; these fence parts of a file you ARE editing.',
        text: BRIEF_TEMPLATE,
      }),
      operatorBulletSendsItToTheMap: hasIn({
        needle: '**`FACTS` and `FENCES` are CUT from your map, never authored here.**',
        text: TEMPLATE,
      }),
      operatorBulletNamesWhoMissesAnAdHocOne: hasIn({
        needle:
          "Authoring\n  one at dispatch instead puts it in a single sub-agent's context, where your reviewer, a sibling\n  flowrider and the next `pt N` session all miss it.",
        text: TEMPLATE,
      }),
      factDefinitionNotDuplicated: BRIEF_TEMPLATE.indexOf(
        'A FACT restating any of those spends a brief and teaches nothing',
      ),
      fenceDefinitionNotDuplicated: BRIEF_TEMPLATE.indexOf(
        'A fence is a boundary only you can draw',
      ),
      toolListNotDuplicated: BRIEF_TEMPLATE.indexOf(
        'it reads `get-architecture`, `get-testing-patterns`, `get-folder-detail` for its folder types',
      ),
      holderExampleNotDuplicated: BRIEF_TEMPLATE.indexOf('wireHarnessLifecycle'),
    }).toStrictEqual({
      factsIsASlice: true,
      fencesIsASlice: true,
      fencesStillSeparatesItselfFromDoNotTouch: true,
      operatorBulletSendsItToTheMap: true,
      operatorBulletNamesWhoMissesAnAdHocOne: true,
      factDefinitionNotDuplicated: -1,
      fenceDefinitionNotDuplicated: -1,
      toolListNotDuplicated: -1,
      holderExampleNotDuplicated: -1,
    });
  });

  // A TRAP REPEATING THE SUB-AGENT'S OWN READING IS A LINE IT HAS ALREADY READ ONCE. The old block
  // invited three examples — a lint rule, a fixture seeded twice, a selector — and the first of those
  // is exactly what `get-architecture` and `get-testing-patterns` already state, so briefs spent the
  // block restating them. One measured brief on the sibling codeweaver track went further and banned
  // `.toBeInTheDocument`, which nothing bans and the repo's own widget tests use throughout; naming
  // where the rule was read is what lets the sub-agent check the operator.
  it('VALID: brief template => narrows TRAPS to a rule this file trips that the sub-agent has not already read', () => {
    expect({
      narrowedWording: hasIn({
        needle:
          "TRAPS\n  <one line each: a rule THIS file trips that none of the sub-agent's own reading states.",
        text: BRIEF_TEMPLATE,
      }),
      namesWhatItHasAlreadyRead: hasIn({
        needle:
          'It arrives having read get-architecture, get-testing-patterns, get-folder-detail for its folder types and every session snippet, so a trap repeating one of those is a line it has already read once.',
        text: BRIEF_TEMPLATE,
      }),
      namesWhereTheRuleWasRead: hasIn({
        needle: 'Name where you read the rule, so it can check you.',
        text: BRIEF_TEMPLATE,
      }),
      openEndedExamplesGone: BRIEF_TEMPLATE.indexOf(
        '<one line each: a lint rule, a fixture that needs seeding twice, a selector>',
      ),
    }).toStrictEqual({
      narrowedWording: true,
      namesWhatItHasAlreadyRead: true,
      namesWhereTheRuleWasRead: true,
      openEndedExamplesGone: -1,
    });
  });

  // A PATH AND A MODE ARE ONE SIDE OF A FILE, NOT A SHAPE. A spec path with no units says nothing
  // about what the file has to bite on, and a harness named with no return says nothing about what
  // the spec gets back from it — so the sub-agent invents the second side and the operator cannot
  // check at step 6 that two files meet. Flowrider's files are mostly specs, so the `proves` form
  // carries the common case and the `in`/`out` pair carries a harness.
  it('VALID: brief template => gives every file in FILES both sides, proves for a spec and in/out for a harness', () => {
    expect({
      specTakesTheProvesForm: hasIn({
        needle: 'FILES\n  <spec path>     new | extend\n      proves  <unit-id> · <unit-id>',
        text: BRIEF_TEMPLATE,
      }),
      harnessTakesTheInOutForm: hasIn({
        needle:
          '<harness path>  new | edit\n      in   <the argument shape>\n      out  <the return type, branded>',
        text: BRIEF_TEMPLATE,
      }),
      operatorBulletDemandsBothSides: hasIn({
        needle:
          "**`FILES` carries BOTH SIDES of every file.** A spec's are its path and the units it `proves`; a harness's are its `in` and its `out`.",
        text: TEMPLATE,
      }),
      oneSideIsNotAShape: hasIn({
        needle:
          'One side is not a shape — a spec path with no units says nothing about what the file has to bite on, and a harness named with no return says nothing about what the spec gets back from it.',
        text: TEMPLATE,
      }),
      singleSidedFilesBlockGone: BRIEF_TEMPLATE.indexOf(
        'FILES\n  <spec path>   new | extend\n\nMAP',
      ),
    }).toStrictEqual({
      specTakesTheProvesForm: true,
      harnessTakesTheInOutForm: true,
      operatorBulletDemandsBothSides: true,
      oneSideIsNotAShape: true,
      singleSidedFilesBlockGone: -1,
    });
  });
});
