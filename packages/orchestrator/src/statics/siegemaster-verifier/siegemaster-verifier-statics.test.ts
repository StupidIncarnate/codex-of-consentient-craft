import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterVerifierStatics } from './siegemaster-verifier-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterVerifierStatics.prompt.template;

describe('siegemasterVerifierStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: siegemasterVerifierStatics.prompt.placeholders.arguments,
    }).toStrictEqual({
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
      placeholder: '$ARGUMENTS',
    });
  });

  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => names its seven top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## Rules',
      '## Pass 1 — walk the whole path, dispatch nothing',
      '## Pass 2 — dispatch two at a time against the list',
      '## How you sign what you measured',
      '## What you return',
      '## The quest id',
    ]);
  });

  it("VALID: served template => names Pass 1's eight steps, then Pass 2's five, in order", () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Read the flow',
      '### 2. Read your guide',
      '### 3. Learn the expected values before you drive',
      '### 4. Load your lane',
      '### 5. Reset, then drive',
      '### 6. Record as you drive',
      '### 7. Stop only where you cannot go on',
      '### 8. Close pass 1: your list, then your sign-off',
      '### 1. Brief from your list, not your memory',
      '### 2. Its job is to fail the test, for the right reason',
      '### 3. Its ward, and nothing wider',
      '### 4. Depth stops with it',
      '### 5. Wait for the pair, then take the next',
    ]);
  });

  // THE ORDER IS THE WHOLE DESIGN — a truncated Pass 2 is visible against the list; a truncated
  // Pass 1 is not. Nothing may be dispatched until Pass 1's list is closed.
  it('VALID: served template => forbids dispatch during Pass 1, and states why the order matters', () => {
    expect({
      ruleStatesIt: hasIn({
        needle:
          "**[NOTHING DURING PASS 1]** You dispatch no sub-agent until pass 1's numbered list is closed.",
        text: TEMPLATE,
      }),
      pass2GatesOnClosedList: hasIn({
        needle: 'Only start here once pass 1 is entirely done',
        text: TEMPLATE,
      }),
      truncatedPass2Visible: hasIn({
        needle: 'A truncated pass 2 is VISIBLE, because your list is the denominator',
        text: TEMPLATE,
      }),
      truncatedPass1Invisible: hasIn({
        needle:
          'A truncated pass 1 is invisible — which is exactly why nothing may be dispatched during it.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      ruleStatesIt: true,
      pass2GatesOnClosedList: true,
      truncatedPass2Visible: true,
      truncatedPass1Invisible: true,
    });
  });

  // DEPTH STOPS AT TWO — measured on the send flow: a fixer spawning grandchildren burned ~4.5M
  // context tokens on one fix. The rule is carried in both the Rules section and Pass 2's own brief
  // step, not left for a session to infer once.
  it('VALID: served template => caps dispatch depth at two, with the measured cost of not capping it', () => {
    expect({
      ruleSaysIt: hasIn({
        needle:
          'the sub-agents you dispatch in pass 2 are one level deeper, and that is the last level there is',
        text: TEMPLATE,
      }),
      measuredCost: hasIn({
        needle: 'burned roughly 4.5 million context tokens',
        text: TEMPLATE,
      }),
      briefStepRepeatsIt: hasIn({
        needle: 'it spawns no sub-agent of its own',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ ruleSaysIt: true, measuredCost: true, briefStepRepeatsIt: true });
  });

  // A PASS-2 SUB-AGENT WRITES A TEST, NEVER A FIX — this is the substance that replaces the old
  // walker/fixer loop with something a later role can pick up.
  it('VALID: served template => a dispatched sub-agent writes a failing test, never a fix, and reports the red path', () => {
    expect({
      findOrCreate: hasIn({
        needle:
          'find the test that ALREADY covers this surface and add an assertion to it. Create a new test file only when none exists.',
        text: TEMPLATE,
      }),
      mustFailForRealReason: hasIn({
        needle:
          'the test must FAIL, against UNCHANGED source, and for the reason your record names',
        text: TEMPLATE,
      }),
      reportsRedPath: hasIn({
        needle: "It reports the red test's path and nothing else it changed.",
        text: TEMPLATE,
      }),
      narrowWard: hasIn({
        needle: 'npm run ward -- --only lint,test -- <its own paths>',
        text: TEMPLATE,
      }),
      neverTypecheck: hasIn({
        needle: "Never `typecheck` — ward's typecheck is `tsc -b`",
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      findOrCreate: true,
      mustFailForRealReason: true,
      reportsRedPath: true,
      narrowWard: true,
      neverTypecheck: true,
    });
  });

  it('VALID: served template => nothing it or its sub-agents produce is ever committed', () => {
    expect({
      rulesSaysNoCommit: hasIn({
        needle: 'You commit nothing, ever — no `git add`, no `git commit`, no `git push`.',
        text: TEMPLATE,
      }),
      redTestsStayUncommitted: hasIn({
        needle: 'Every test a sub-agent creates or extends stays uncommitted.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ rulesSaysNoCommit: true, redTestsStayUncommitted: true });
  });

  // `BROKEN WOULD SHOW` IS THE WHOLE PROOF — carried over unchanged from the walker this role
  // replaces on the loop, because the measurement discipline does not change even though the
  // consequence of a finding (a red test, not a report) does.
  it('VALID: served template => requires a BROKEN WOULD SHOW value on every unit record', () => {
    expect({
      fieldInTheRecordShape: hasIn({
        needle: 'BROKEN WOULD SHOW: <the specific different value a defect would have produced>',
        text: TEMPLATE,
      }),
      namedAsTheWholeProof: hasIn({
        needle: '**`BROKEN WOULD SHOW` is the whole proof.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ fieldInTheRecordShape: true, namedAsTheWholeProof: true });
  });

  // THE RETURN BLOCK IS A WIRE FORMAT its parent parses by field name, and it is deliberately three
  // lines — the full record lives on disk, never in the return, because the parent's context is the
  // scarcest thing in this design.
  it('VALID: served template => returns exactly these three fields, in order, and nothing more', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z][A-Z ]*):/gmu), (match) => match[1])).toStrictEqual(
      ['NEXT', 'COVERAGE', 'RED TESTS'],
    );
  });

  it('VALID: served template => writes its full record to a round file and returns none of it as text', () => {
    expect({
      filePath: hasIn({
        needle: 'Write ALL of it to `.quest-plans/<operationItemId>-round-<n>.md`',
        text: TEMPLATE,
      }),
      contextIsScarcest: hasIn({
        needle: "The parent's context is the scarcest thing in this whole design",
        text: TEMPLATE,
      }),
    }).toStrictEqual({ filePath: true, contextIsScarcest: true });
  });

  it('VALID: served template => ends its return on a NEXT: line carrying exactly pass, rework and wall', () => {
    expect(
      hasIn({
        needle: 'NEXT:      pass | rework — <what is left> | wall — <what a person must change>',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THIS ROLE NEVER SIGNALS — it is a minion that returns text inside its parent's turn.
  it('VALID: served template => states plainly that it calls no signal-back', () => {
    expect(
      hasIn({
        needle: '**[TURN END]** You return text. You call no `signal-back`.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A WORK ITEM ID REACHES THIS SESSION, AND WHERE IT MAY GO IS THE WHOLE POINT: into a sign-off,
  // and into its own round file's name — nowhere else, and never into a get-agent-prompt fetch this
  // role never makes in the first place (its sub-agents get no served prompt of their own).
  it('VALID: served template => uses workItemId only in a sign-off and its round file name, and calls get-agent-prompt nowhere', () => {
    expect({
      namesItForTheSignoff: hasIn({
        needle: "workItemId: 'WORK ITEM from your brief'",
        text: TEMPLATE,
      }),
      briefLineScopesIt: hasIn({
        needle:
          "It goes in every sign-off you write, and in your round file's name below — nowhere else.",
        text: TEMPLATE,
      }),
      neverFetchesAgentPrompt: TEMPLATE.includes('get-agent-prompt'),
    }).toStrictEqual({
      namesItForTheSignoff: true,
      briefLineScopesIt: true,
      neverFetchesAgentPrompt: false,
    });
  });

  // IT SIGNS OBSERVABLE/TERMINAL/BRANCH ONLY — off-map belongs to a sibling role, and this role's
  // modify-quest example carries no offMapSignoffs branch at all, unlike the walker it replaces on
  // the loop.
  it('VALID: served template => signs observable, terminal and branch units, and never off-map', () => {
    expect({
      statesTheScope: hasIn({
        needle:
          'You sign observable, terminal and branch units on your own `PATH` only. Never `off-map`',
        text: TEMPLATE,
      }),
      namesSiblingOwnership: hasIn({
        needle: 'a sibling role owns that family, and its units never appear on your `UNITS:` list',
        text: TEMPLATE,
      }),
      carriesNoOffMapBranch: TEMPLATE.includes('offMapSignoffs'),
    }).toStrictEqual({
      statesTheScope: true,
      namesSiblingOwnership: true,
      carriesNoOffMapBranch: false,
    });
  });

  it('VALID: served template => signs once, and treats a route-dependent answer as two observables', () => {
    expect(
      hasIn({
        needle:
          "If an observable's true answer depends on which route reaches it, that is TWO observables, never one signed twice.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // NOT CLAUDE-IN-CHROME — the whole point of this role over the walker it replaces on the loop is
  // that it drives a file-commanded Playwright lane instead of a browser extension. No extension
  // tool name, and none of the tab-hygiene/hidden-tab/JS-modal warnings that only ever applied to
  // that extension may appear here.
  it('VALID: served template => drives a Playwright lane, and carries no Claude-in-Chrome extension artefacts', () => {
    expect({
      namesNoExtensionTool: TEMPLATE.includes('mcp__claude-in-chrome__'),
      namesNoTabHygiene: TEMPLATE.includes('tabs_close_mcp'),
      namesNoHiddenTabTrap: TEMPLATE.includes('visibilityState'),
      namesNoJsModalBan: TEMPLATE.includes('JavaScript `alert`'),
      namesTheLaneVerbs: hasIn({
        needle:
          '`goto` · `waitFor` · `click` · `type` · `key` · `paste` · `screenshot` · `box` · `dom` · `storage` · `console` · `network` · `ws` · `eval` · `file` · `end`',
        text: TEMPLATE,
      }),
      needsNoToolSearch: hasIn({
        needle: 'You need no `ToolSearch` call to reach it.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      namesNoExtensionTool: false,
      namesNoTabHygiene: false,
      namesNoHiddenTabTrap: false,
      namesNoJsModalBan: false,
      namesTheLaneVerbs: true,
      needsNoToolSearch: true,
    });
  });

  // THE LANE IS THIS SESSION'S OWN TO START — its brief carries a bare NAME, and the driver builds
  // `tmp/siege/<name>/` around it, so every address the walk uses comes out of the manifest that
  // driver writes rather than out of the brief. Started once and never again: a restart destroys
  // any unit measuring a difference from a value only that process's lifetime provides.
  it('VALID: served template => starts its own lane from a bare name, once, and reads its manifest for every address', () => {
    expect({
      startsItFirst: hasIn({
        needle:
          "**[START YOUR LANE ONCE]** The lane is this path walk's own, and starting it is YOUR first action",
        text: TEMPLATE,
      }),
      theCommand: hasIn({
        needle:
          'ls packages/*/test/siege-driver/siege-driver.ts\nnpx tsx <the one path that printed> <the LANE: name in your brief>',
        text: TEMPLATE,
      }),
      backgrounded: hasIn({
        needle: '**Background it** — never run it in the foreground',
        text: TEMPLATE,
      }),
      onceOnly: hasIn({ needle: '**Start it ONCE and never again this round.**', text: TEMPLATE }),
      neverStopsIt: hasIn({
        needle:
          '**You never stop it either**: it closes itself once no new command has arrived for its idle window.',
        text: TEMPLATE,
      }),
      laneNameIsNotAPath: hasIn({
        needle:
          'the bare NAME of your Playwright lane for this round. Not a path: you hand that name to the driver and it builds every directory under it.',
        text: TEMPLATE,
      }),
      readsTheManifest: hasIn({
        needle: '`Read` `tmp/siege/<your LANE: name>/lane.json` — the manifest it wrote at boot',
        text: TEMPLATE,
      }),
      neverSendsEnd: hasIn({
        needle: '**Never send `end`**: it closes the lane on the spot',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      startsItFirst: true,
      theCommand: true,
      backgrounded: true,
      onceOnly: true,
      neverStopsIt: true,
      laneNameIsNotAPath: true,
      readsTheManifest: true,
      neverSendsEnd: true,
    });
  });

  // A DEAD LANE IS REPLACED, NOT REPORTED AND NOT A WALL — this session started it, so it starts
  // the next one; what the record owes is that the restart happened, since a unit measured before
  // one is not comparable with a unit measured after it.
  it('VALID: served template => replaces a dead lane under a fresh name and never calls one a wall', () => {
    expect({
      startsAFreshOne: hasIn({
        needle:
          '**A lane that dies under you is not something you route around silently.** Start a fresh one — the same command, your own name with `-2` appended, then `-3`',
        text: TEMPLATE,
      }),
      recordsTheRestart: hasIn({
        needle:
          'write into your record which node you had reached when it happened, and treat nothing you measured before it as comparable with what you measure after.',
        text: TEMPLATE,
      }),
      neverAWall: hasIn({ needle: '**A lane is never a wall.**', text: TEMPLATE }),
      deadLaneIsRework: hasIn({
        needle: 'is a defect this round found: report what the driver wrote and return `rework`.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      startsAFreshOne: true,
      recordsTheRestart: true,
      neverAWall: true,
      deadLaneIsRework: true,
    });
  });

  // ALL FOUR OBSERVABLE SURFACES COME FROM ONE PLACE — the lane. This table is the change that
  // makes an `api-call` unit's real request/response readable at all, where the old tooling could
  // not reach it.
  it('VALID: served template => maps all four observable surfaces to the one lane', () => {
    expect({
      uiState: hasIn({
        needle:
          '| `ui-state` | `screenshot` to a path you `Read`, plus `box` for the exact pixel geometry |',
        text: TEMPLATE,
      }),
      custom: hasIn({
        needle:
          '| `custom` | `eval` against the page, then your own reasoning about the invariant |',
        text: TEMPLATE,
      }),
      apiCall: hasIn({
        needle:
          '| `api-call` | `network` — the real request body and the real response, not a guess from the DOM |',
        text: TEMPLATE,
      }),
      fileExists: hasIn({
        needle:
          "| `file-exists` | `file` — resolves a relative path against the lane's own `DUNGEONMASTER_HOME`, never the repo root, where a denied Bash call cannot reach |",
        text: TEMPLATE,
      }),
      trustedInputIsFree: hasIn({ needle: '**Trusted input is free.**', text: TEMPLATE }),
    }).toStrictEqual({
      uiState: true,
      custom: true,
      apiCall: true,
      fileExists: true,
      trustedInputIsFree: true,
    });
  });

  // A WALKER'S FOUR-FIELD RECORD DRIVES A LIVE SYSTEM BY HAND — it takes neither the evidence
  // contract (that governs a written test suite) nor the standing concerns (that govern a code
  // review). This role inherits that boundary unchanged from the walker it replaces on the loop.
  it('VALID: served template => carries none of the three shared reviewer/authoring blocks', () => {
    expect({
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ judging: false, authoring: false, standards: false });
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

  it('VALID: served template => uses PATH WALK vocabulary for what it drives', () => {
    expect(hasIn({ needle: 'one whole PATH WALK through one flow', text: TEMPLATE })).toBe(true);
  });
});
