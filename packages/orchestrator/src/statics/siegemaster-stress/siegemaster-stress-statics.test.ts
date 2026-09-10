import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';

import { siegemasterStressStatics } from './siegemaster-stress-statics';

const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = siegemasterStressStatics.prompt.template;

describe('siegemasterStressStatics', () => {
  it('VALID: served template => carries exactly one $ARGUMENTS slot, and it is last', () => {
    expect({
      count: TEMPLATE.split('$ARGUMENTS').length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith('$ARGUMENTS'),
      underItsOwnHeading: hasIn({ needle: '## The quest id\n\n$ARGUMENTS', text: TEMPLATE }),
      placeholder: siegemasterStressStatics.prompt.placeholders.arguments,
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
      '## Your tools',
      '## Workflow',
      '## Briefing a sub-agent',
      '## What you return',
      '## The quest id',
    ]);
  });

  it('VALID: served template => names its five workflow steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Read the flow',
      '### 2. Enumerate every stress point — PASS 1',
      '### 3. Dispatch — PASS 2',
      '### 4. Read what came back',
      '### 5. Sign what you found',
    ]);
  });

  // PASS 1 IS THE DENOMINATOR — a truncated PASS 2 is visible against the list it produced; a
  // truncated PASS 1 is invisible, because nothing else counts what should have been on it. This is
  // why dispatch is forbidden until the list is finished.
  it('VALID: served template => forbids any dispatch until the PASS 1 list is finished', () => {
    expect(
      hasIn({
        needle: '**Dispatch nothing until this list is finished.**',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => writes no product code, may break its own lane, and commits nothing', () => {
    expect({
      noProductCode: hasIn({
        needle: '**You write no product code, and you fix nothing.**',
        text: TEMPLATE,
      }),
      laneIsYoursToBreak: hasIn({
        needle:
          '**[THE LANE IS YOURS TO BREAK] Do to it what a shared browser could never allow.**',
        text: TEMPLATE,
      }),
      neverCommits: hasIn({
        needle: '**[NO COMMIT] Nothing you or a sub-agent writes gets committed.**',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ noProductCode: true, laneIsYoursToBreak: true, neverCommits: true });
  });

  // MEASURED ON THE SEND FLOW — a fixer that let its own sub-agent go looking spawned ten Explore
  // grandchildren and burned roughly 4.5 million context tokens on a single fix. This role's
  // sub-agents are depth 2; nothing they dispatch may be depth 3.
  it('VALID: served template => stops sub-agent depth at two, naming the measured cost of not stopping', () => {
    expect({
      tag: hasIn({
        needle: '**[DEPTH STOPS AT 2] Your sub-agents spawn nothing.**',
        text: TEMPLATE,
      }),
      measuredCost: hasIn({ needle: '4.5 million context tokens', text: TEMPLATE }),
      briefedToDoItThemselves: hasIn({
        needle: 'Brief every sub-agent to `discover` and `Read`\nfor itself',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ tag: true, measuredCost: true, briefedToDoItThemselves: true });
  });

  // SCOPE IS THE WHOLE RULE, NOT A LIST OF CHECK TYPES — a sub-agent grades its own path and ward
  // picks what fits those files; a bare run or a `--uncommitted` lands a sibling's reds on it.
  it("VALID: served template => scopes every sub-agent ward run to that sub-agent's own path alone", () => {
    expect({
      ruleScopesIt: hasIn({
        needle:
          '**[WARD SCOPE] A sub-agent proves its test is really red with `npm run ward -- -- <its own path>`, nothing wider.**',
        text: TEMPLATE,
      }),
      neverBareNeverUncommitted: hasIn({
        needle: 'never a bare `npm run ward` and never `--uncommitted`',
        text: TEMPLATE,
      }),
      neverE2e: hasIn({
        needle:
          'Never e2e — the failing test this role produces lives at whichever layer actually owns the behaviour (a contract, a guard, a broker, a responder), not in a Playwright spec.',
        text: TEMPLATE,
      }),
      ownScope: hasIn({
        needle: "npm run ward -- -- <this test's own path>",
        text: TEMPLATE,
      }),
      nothingWider: hasIn({
        needle: 'ward on your own path only · no e2e · no --uncommitted',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      ruleScopesIt: true,
      neverBareNeverUncommitted: true,
      neverE2e: true,
      ownScope: true,
      nothingWider: true,
    });
  });

  // WHAT IT SIGNS, AND ONLY ONCE — questModifyBroker merges by unit id, so a second sign-off on the
  // same family overwrites the first's evidence rather than adding to it.
  it('VALID: served template => signs its one allocated family once, and never an observable, terminal or branch unit', () => {
    expect({
      signOnce: hasIn({
        needle: '**[SIGN ONCE] One `modify-quest` call, at the very end, closes your family.**',
        text: TEMPLATE,
      }),
      overwriteReason: hasIn({ needle: 'questModifyBroker` merges by unit id', text: TEMPLATE }),
      naIsConfirmed: hasIn({
        needle: 'An honest `N/A for this path because …` is a `confirmed` verdict',
        text: TEMPLATE,
      }),
      neverTheVerifiersUnits: hasIn({
        needle: 'You sign none of them; they belong to the verifier.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      signOnce: true,
      overwriteReason: true,
      naIsConfirmed: true,
      neverTheVerifiersUnits: true,
    });
  });

  it('VALID: served template => a perf point against one row is unreached, never held', () => {
    expect(
      hasIn({
        needle:
          '**A `perf` point proven against one row proves nothing** — one row cannot tell flat from quadratic.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // `end` IS THE ONE VERB A SUB-AGENT MAY NOT SEND — the driver stops its whole lane on it, taking
  // the browser and both servers down for every sub-agent that drives after this one. It belongs to
  // the session that started the lane, once every point has run.
  it('VALID: served template => names every one of the sixteen lane commands and forbids a sub-agent sending end', () => {
    expect({
      allSixteen: hasIn({
        needle:
          'The verbs are goto, waitFor, click, type, key, paste, screenshot, box, dom, storage, console, network, ws, eval, file, end.',
        text: TEMPLATE,
      }),
      neverEnd: hasIn({
        needle:
          'Never send `end`: it closes the lane on\n  everybody, and closing this one belongs to the session that briefed you, after every point has\n  run. Reset instead, so the page is free for whoever drives next.',
        text: TEMPLATE,
      }),
      commandShape: hasIn({
        needle:
          'A command is one json file written into commandsDir — {"name": "goto", "target": "/"}, with value, filePath and timeoutMs optional — answered by the file of the same basename in resultsDir, whose first line is OK or FAIL.',
        text: TEMPLATE,
      }),
    }).toStrictEqual({ allSixteen: true, neverEnd: true, commandShape: true });
  });

  // THE LANE IS THIS SESSION'S TO START AND ITS SUB-AGENTS' TO DRIVE — the brief carries a bare
  // NAME, the driver builds `tmp/siege/<name>/` around it, and every address the sub-agents quote
  // comes out of the manifest it writes. A probe that kills it earns a fresh one under a new name,
  // recorded, because points either side of a restart are not comparable.
  it('VALID: served template => starts its own lane from a bare name and replaces one its probes killed', () => {
    expect({
      startsItFirst: hasIn({
        needle:
          '**You start it\nyourself, as your first action**, backgrounded, from the repo root',
        text: TEMPLATE,
      }),
      theCommand: hasIn({
        needle:
          'ls packages/*/test/siege-driver/siege-driver.ts\nnpx tsx <the one path that printed> <the LANE: name in your brief>',
        text: TEMPLATE,
      }),
      laneNameIsNotAPath: hasIn({
        needle:
          "the bare NAME of this path walk's own Playwright lane. Not a path: you hand that name to the driver",
        text: TEMPLATE,
      }),
      restartsAfterAKill: hasIn({
        needle:
          '**A probe that kills the lane leaves it dead, and you start a fresh one before the next drive** — the same command, your own name with `-2` appended, then `-3`.',
        text: TEMPLATE,
      }),
      recordsWhichSideOfIt: hasIn({
        needle: 'Write into your `PLAN:` file which points ran before each restart and which after',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      startsItFirst: true,
      theCommand: true,
      laneNameIsNotAPath: true,
      restartsAfterAKill: true,
      recordsWhichSideOfIt: true,
    });
  });

  // WHICHEVER LANE IS STILL UP AT THE END IS THIS SESSION'S TO CLOSE, and `end` is the only shutdown
  // that reaches the API server, Vite server and browser the driver spawned detached. A stop hook
  // refuses a turn while a backgrounded command runs, so a lane left up holds this session open on
  // the one entry only it can clear — and the sessions that could not clear it went hunting the
  // process table and killed other rounds' lanes mid-walk. Its own probes may already have taken
  // the lane, which is why the rule says nothing is left to close in that case rather than
  // demanding a shutdown that would fail.
  it('VALID: served template => closes its last live lane with `end` and hunts no processes', () => {
    expect({
      closesItLast: hasIn({
        needle:
          '**[CLOSE YOUR LANE LAST]** Closing whichever lane is still up is your FINAL action, after your\n`PLAN:` file is written and your family is signed.',
        text: TEMPLATE,
      }),
      theEndCommand: hasIn({
        needle: 'Write  <commandsDir>/999-end.json   { "name": "end" }',
        text: TEMPLATE,
      }),
      refusalClearsItself: hasIn({
        needle:
          'a stop refused over that\ncommand clears itself the next time you try — give your final response again rather than doing\nanything about it.',
        text: TEMPLATE,
      }),
      leavingItUpStrandsThree: hasIn({
        needle:
          'a lane torn down that way strands its API server, its Vite server and\nits browser',
        text: TEMPLATE,
      }),
      aDeadLaneNeedsNothing: hasIn({
        needle:
          'Lanes an earlier probe already killed need none of this, and neither does\na run whose last probe took the lane with it; there is nothing left to close.',
        text: TEMPLATE,
      }),
      noProcessHunting: hasIn({
        needle: '**Never go hunting the process table.**',
        text: TEMPLATE,
      }),
      writeIsScopedToPlanAndEnd: hasIn({
        needle: 'your PLAN: path, and the one `end` command that closes your lane',
        text: TEMPLATE,
      }),
    }).toStrictEqual({
      closesItLast: true,
      theEndCommand: true,
      refusalClearsItself: true,
      leavingItUpStrandsThree: true,
      aDeadLaneNeedsNothing: true,
      noProcessHunting: true,
      writeIsScopedToPlanAndEnd: true,
    });
  });

  // THIS ROLE NEVER SIGNALS — it is a minion that returns text inside its parent's turn.
  it('VALID: served template => states plainly that it calls no signal-back, rather than omitting the word', () => {
    expect(
      hasIn({
        needle: '**[TURN END] You return text. You call no `signal-back`.**',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE RETURN BLOCK IS A WIRE FORMAT its parent parses by field name, and it is deliberately three
  // fields — the parent's context is the scarcest thing in this design.
  it('VALID: served template => returns exactly coverage, tests and next, in that order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^([A-Z]+):/gmu), (match) => match[1])).toStrictEqual([
      'COVERAGE',
      'TESTS',
      'NEXT',
    ]);
  });

  it('VALID: served template => tells its parent to return only those three lines, because context is scarce', () => {
    expect(
      hasIn({
        needle: 'Return only these three lines.',
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  it('VALID: served template => carries the spilled-result rule but neither reviewer/authoring shared block', () => {
    expect({
      spilled: hasIn({ needle: spilledToolResultStatics.markdown, text: TEMPLATE }),
      judging: hasIn({ needle: flowEvidenceContractStatics.judgingMarkdown, text: TEMPLATE }),
      authoring: hasIn({ needle: flowEvidenceContractStatics.authoringMarkdown, text: TEMPLATE }),
      standards: hasIn({ needle: standardsReviewConcernsStatics.markdown, text: TEMPLATE }),
    }).toStrictEqual({ spilled: true, judging: false, authoring: false, standards: false });
  });

  it('VALID: served template => carries no claude-in-chrome tooling, tab hygiene, or JS-modal ban', () => {
    expect({
      claudeInChrome: hasIn({ needle: 'claude-in-chrome', text: TEMPLATE }),
      tabHygiene: hasIn({ needle: 'tabs_close_mcp', text: TEMPLATE }),
      hiddenTabWarning: hasIn({ needle: 'visibilityState', text: TEMPLATE }),
      jsModalBan: hasIn({ needle: 'alert`, `confirm` or `prompt`', text: TEMPLATE }),
    }).toStrictEqual({
      claudeInChrome: false,
      tabHygiene: false,
      hiddenTabWarning: false,
      jsModalBan: false,
    });
  });

  it('VALID: served template => carries no round-protocol vocabulary', () => {
    expect({
      roundDocument: hasIn({ needle: 'round document', text: TEMPLATE }),
      wavesUppercase: TEMPLATE.includes('WAVES'),
      pathWalk: hasIn({ needle: 'path walk', text: TEMPLATE }),
    }).toStrictEqual({
      roundDocument: false,
      wavesUppercase: false,
      pathWalk: true,
    });
  });
});
