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
  it('VALID: brief template => makes the sub-agent explore for itself and dispatch nothing below it', () => {
    expect({
      ownDiscovery: hasIn({
        needle: 'Do your OWN discovery, with the discover tool.',
        text: BRIEF_TEMPLATE,
      }),
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
      ownDiscovery: true,
      refusesToDelegateExploring: true,
      saysWhyItIsWorthKeeping: true,
      namesItsOwnLevel: true,
    });
  });
});
