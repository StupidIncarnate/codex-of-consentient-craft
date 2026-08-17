import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { slotManagerStatics } from '../slot-manager/slot-manager-statics';
import { operationOrchestratorPromptStatics } from './operation-orchestrator-prompt-statics';

const has = (needle: string): boolean =>
  operationOrchestratorPromptStatics.prompt.template.includes(needle);

// The template is served through `get-agent-prompt` alongside the interpolated operation context.
// Everything discipline-specific belongs in the pack, not here, and this is the number that says so.
const BUDGET_CHARS_EXCLUDING_OPERATING_RULES = 12_000;

describe('operationOrchestratorPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(operationOrchestratorPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          myDiscipline: '$MY_DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  // `$DISCIPLINE` is substituted with the pack's authored MARKDOWN and `$MY_DISCIPLINE` with the
  // bare discipline id, by two independent `.replace` calls in two separate resolvers. If one token
  // were a PREFIX of the other — `$DISCIPLINE_NAME` and `$DISCIPLINE_ID` both are — the pack
  // substitution would match the prefix first and leave `<whole pack markdown>_NAME` behind. The
  // next person to rename one of these has no way to know that from the call sites, so it is pinned
  // here: neither token may contain the other, in either direction.
  describe('the two discipline placeholders cannot collide under substitution', () => {
    it('VALID: {both placeholders} => neither token contains the other, so substitution order is irrelevant', () => {
      const { discipline, myDiscipline } = operationOrchestratorPromptStatics.prompt.placeholders;

      expect({
        packTokenContainsIdToken: discipline.includes(myDiscipline),
        idTokenContainsPackToken: myDiscipline.includes(discipline),
        idTokenStartsWithPackToken: myDiscipline.startsWith(discipline),
        packTokenStartsWithIdToken: discipline.startsWith(myDiscipline),
      }).toStrictEqual({
        packTokenContainsIdToken: false,
        idTokenContainsPackToken: false,
        idTokenStartsWithPackToken: false,
        packTokenStartsWithIdToken: false,
      });
    });

    it('VALID: {pack substituted first} => the id token survives verbatim and then resolves', () => {
      const { template, placeholders } = operationOrchestratorPromptStatics.prompt;

      const packFirst = template
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>')
        .replace(placeholders.myDiscipline, () => 'manual-qa');

      expect({
        packToken: packFirst.split(placeholders.discipline).length - 1,
        idToken: packFirst.split(placeholders.myDiscipline).length - 1,
        pack: packFirst.split('<PACK MARKDOWN>').length - 1,
        id: packFirst.split("discipline: 'manual-qa'").length - 1,
      }).toStrictEqual({ packToken: 0, idToken: 0, pack: 1, id: 1 });
    });

    it('VALID: {id substituted first} => the pack token survives verbatim and then resolves', () => {
      const { template, placeholders } = operationOrchestratorPromptStatics.prompt;

      const idFirst = template
        .replace(placeholders.myDiscipline, () => 'manual-qa')
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>');

      expect({
        packToken: idFirst.split(placeholders.discipline).length - 1,
        idToken: idFirst.split(placeholders.myDiscipline).length - 1,
        pack: idFirst.split('<PACK MARKDOWN>').length - 1,
        id: idFirst.split("discipline: 'manual-qa'").length - 1,
      }).toStrictEqual({ packToken: 0, idToken: 0, pack: 1, id: 1 });
    });

    it('VALID: {either order} => both orders produce the identical rendered prompt', () => {
      const { template, placeholders } = operationOrchestratorPromptStatics.prompt;

      const packFirst = template
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>')
        .replace(placeholders.myDiscipline, () => 'manual-qa');
      const idFirst = template
        .replace(placeholders.myDiscipline, () => 'manual-qa')
        .replace(placeholders.discipline, () => '<PACK MARKDOWN>');

      expect(idFirst).toBe(packFirst);
    });
  });

  // Both placeholders are substituted by the serving transformer. $ARGUMENTS must stay LAST: the
  // operation context is appended there, and anything after it would be pushed past the served
  // block's tail on a big quest.
  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    const { template } = operationOrchestratorPromptStatics.prompt;

    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      myDisciplineCount: template.split('$MY_DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      argumentsOnItsOwnLine: /^\$ARGUMENTS$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      myDisciplineComesBeforeArguments:
        template.indexOf('$MY_DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      operationContextHeading: /^## Operation Context$/mu.test(template),
    }).toStrictEqual({
      disciplineCount: 1,
      myDisciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      argumentsOnItsOwnLine: true,
      disciplineComesFirst: true,
      myDisciplineComesBeforeArguments: true,
      argumentsIsTheTail: true,
      operationContextHeading: true,
    });
  });

  // The work-item variant, not either minion one: this session OWNS an operation item and its
  // terminal action is `signal-back`. Both minion blocks mandate the opposite and would contradict
  // the loop.
  it('VALID: template => embeds the work-item operating rules, not either minion variant', () => {
    expect({
      workItemVariant: has(agentOperatingRulesStatics.markdown),
      delegatingMinionVariant: has(agentOperatingRulesStatics.delegatingMinionMarkdown),
      leafMinionVariant: has(agentOperatingRulesStatics.leafMinionMarkdown),
    }).toStrictEqual({
      workItemVariant: true,
      delegatingMinionVariant: false,
      leafMinionVariant: false,
    });
  });

  it('VALID: template => stays under its budget excluding the operating-rules block', () => {
    const { template } = operationOrchestratorPromptStatics.prompt;

    expect(template.length - agentOperatingRulesStatics.markdown.length).toBeLessThan(
      BUDGET_CHARS_EXCLUDING_OPERATING_RULES,
    );
  });

  // Over `maxVerbatimChars` the MCP layer spills the tool result to a file and hands the agent an
  // error stub, so the session starts holding a path instead of its gates.
  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(operationOrchestratorPromptStatics.prompt.template.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  it('VALID: template => declares the tool surface EXHAUSTIVE and frames both halves of the table', () => {
    expect({
      heading: /^## Your tool surface — this list is EXHAUSTIVE$/mu.test(
        operationOrchestratorPromptStatics.prompt.template,
      ),
      allowed: has('ALLOWED'),
      forbidden: has('FORBIDDEN — no exceptions, no "just this once"'),
      neverSeesSource: has(
        'Read / Edit / Write on ANY file under src/     ← you never see source. That is the point.',
      ),
      noSelfAuthoring: has('writing a test, a fix, or a sign-off yourself'),
      correctnessIsTheReviewers: has(
        "judging whether code is CORRECT                ← that is the reviewer's verdict to render, not yours",
      ),
      dispatchesThreeMinions: has('Agent(planner-minion | worker-minion | reviewer-minion)'),
      wardTakesExplicitPaths: has('npm run ward -- -- <explicit file paths>'),
    }).toStrictEqual({
      heading: true,
      allowed: true,
      forbidden: true,
      neverSeesSource: true,
      noSelfAuthoring: true,
      correctnessIsTheReviewers: true,
      dispatchesThreeMinions: true,
      wardTakesExplicitPaths: true,
    });
  });

  // Naming a standards or search tool anywhere OUTSIDE the FORBIDDEN block is what re-opens the
  // context leak this role exists to close: a session that loads ~110KB of standards cannot finish
  // the loop, and the dispatches it then drops are invisible in a green run. Each name is asserted
  // BOTH ways — absent outside, present inside — so emptying the block cannot silently pass.
  it('VALID: template => names every standards and search tool only inside the FORBIDDEN block', () => {
    const { template } = operationOrchestratorPromptStatics.prompt;
    const forbiddenBlock = template.slice(
      template.indexOf('FORBIDDEN — no exceptions'),
      template.indexOf('judging whether code is CORRECT'),
    );
    const outsideTheBlock = template.replace(forbiddenBlock, '');

    expect({
      outside: {
        getArchitecture: outsideTheBlock.split('get-architecture').length - 1,
        getSyntaxRules: outsideTheBlock.split('get-syntax-rules').length - 1,
        getTestingPatterns: outsideTheBlock.split('get-testing-patterns').length - 1,
        discover: outsideTheBlock.split('discover').length - 1,
        getProjectMap: outsideTheBlock.split('get-project-map').length - 1,
        getProjectInventory: outsideTheBlock.split('get-project-inventory').length - 1,
        getFolderDetail: outsideTheBlock.split('get-folder-detail').length - 1,
      },
      inside: {
        getArchitecture: forbiddenBlock.split('get-architecture').length - 1,
        getSyntaxRules: forbiddenBlock.split('get-syntax-rules').length - 1,
        getTestingPatterns: forbiddenBlock.split('get-testing-patterns').length - 1,
        discover: forbiddenBlock.split('discover').length - 1,
        getProjectMap: forbiddenBlock.split('get-project-map').length - 1,
        getProjectInventory: forbiddenBlock.split('get-project-inventory').length - 1,
        getFolderDetail: forbiddenBlock.split('get-folder-detail').length - 1,
      },
    }).toStrictEqual({
      outside: {
        getArchitecture: 0,
        getSyntaxRules: 0,
        getTestingPatterns: 0,
        discover: 0,
        getProjectMap: 0,
        getProjectInventory: 0,
        getFolderDetail: 0,
      },
      inside: {
        getArchitecture: 1,
        getSyntaxRules: 1,
        getTestingPatterns: 1,
        discover: 1,
        getProjectMap: 1,
        getProjectInventory: 1,
        getFolderDetail: 1,
      },
    });
  });

  it('VALID: template => names the context cost of reading source rather than only banning it', () => {
    expect({
      leftYourRole: has('**you have left your role — dispatch instead.**'),
      mechanicalNotStylistic: has('The reason is mechanical,\nnot stylistic'),
      contextSurvivesTheLoop: has(
        'your value is that your context stays small enough to run the WHOLE loop to its end.',
      ),
      namesTheFailureMode: has(
        'A session that reads source runs out of room mid-loop and starts skipping dispatches',
      ),
      wasMeasured: has('and it was measured, not imagined'),
    }).toStrictEqual({
      leftYourRole: true,
      mechanicalNotStylistic: true,
      contextSurvivesTheLoop: true,
      namesTheFailureMode: true,
      wasMeasured: true,
    });
  });

  // The pack can narrow scope; it can never widen the tool surface. Without this the five packs are
  // five independent chances to hand the orchestrator back a tool the table forbids.
  it('VALID: template => resolves discipline-vs-page conflicts by axis', () => {
    expect({
      disciplineWinsOnScope: has('the discipline\nwins'),
      pageWinsOnLoopAndTools: has(
        'Where they disagree about the LOOP or the TOOL SURFACE, this page wins',
      ),
      packMayNotWiden: has('no discipline may\nhand you back a tool the table above forbids'),
    }).toStrictEqual({
      disciplineWinsOnScope: true,
      pageWinsOnLoopAndTools: true,
      packMayNotWiden: true,
    });
  });

  it('VALID: template => runs the ten gates in order, plan persisted then read back', () => {
    expect({
      readsCommitBodies: has('**read the BODIES**'),
      noFixedLogWindow: has('not a fixed `-15` window'),
      ptPrefixMeansPredecessor: has('A `pt N:` prefix on your item means a predecessor'),
      buildIsItsOwnCommand: has(
        '**2. `npm run build` — its OWN command, unpiped, exit 0 confirmed.**',
      ),
      soleBuilder: has('**You are the only session on this\nquest that ever runs it**'),
      denominatorFromTheDiscipline: has('**3. Fetch your denominator.**'),
      onePlanner: has('**4. Dispatch ONE `planner-minion`.**'),
      readsThePlanBack: has(
        "**5. Read the plan back with `get-quest-planning-notes({ questId: 'QUEST_ID' })`.**",
      ),
      notFromTheSummary: has('the summary is a pointer, the persisted\nplan is the artifact'),
      workersOneAtATime: has('**6. Dispatch `worker-minion`s ONE AT A TIME**'),
      oneReviewer: has('**7. Dispatch ONE `reviewer-minion`**'),
      wardTakesPlanFilePaths: has(
        '**8. `npm run build`, then `npm run ward -- -- <the files this round touched>`**',
      ),
      commitsTheRound: has('**9. Commit the round.**'),
      remainderDrivesTheLoop: has('Reviewer `REMAINDER` non-empty → back to gate 4'),
      roundCapNamesTheStatic: has(
        `${slotManagerStatics.operationOrchestrator.maxRoundsPerSession} rounds spent with a remainder still\nstanding → commit and signal \`partial\``,
      ),
    }).toStrictEqual({
      readsCommitBodies: true,
      noFixedLogWindow: true,
      ptPrefixMeansPredecessor: true,
      buildIsItsOwnCommand: true,
      soleBuilder: true,
      denominatorFromTheDiscipline: true,
      onePlanner: true,
      readsThePlanBack: true,
      notFromTheSummary: true,
      workersOneAtATime: true,
      oneReviewer: true,
      wardTakesPlanFilePaths: true,
      commitsTheRound: true,
      remainderDrivesTheLoop: true,
      roundCapNamesTheStatic: true,
    });
  });

  // Gate 10 used to spell out the literal "Three" here. Building the expected phrase from the LIVE
  // `slotManagerStatics.operationOrchestrator.maxRoundsPerSession` import — instead of hardcoding "3"
  // in this assertion too — is what actually pins the template to the static rather than to a number
  // that merely happens to match today: if a future edit reverts the interpolation and hand-writes a
  // literal back into the template, this test starts asserting against whatever the static says THEN,
  // and fails the moment the two disagree. A hardcoded "3" in this test would not catch that.
  it('VALID: template => interpolates the round cap from slotManagerStatics rather than a hardcoded literal', () => {
    expect(
      has(
        `${slotManagerStatics.operationOrchestrator.maxRoundsPerSession} rounds spent with a remainder still\nstanding → commit and signal \`partial\`, naming the remainder in the commit body.`,
      ),
    ).toBe(true);
  });

  // A bare instruction was ignored 13/13 times on the quest this came from; a named consequence
  // bolted to the exact parameter held 30/30. All three of these carry their cost inline.
  it('VALID: template => bolts a named consequence onto serial dispatch', () => {
    expect({
      oneCallPerMessage: has(
        'Dispatch exactly ONE `worker-minion` per assistant message and wait for it to\nreturn before the next.',
      ),
      neverTwoInOneMessage: has('NEVER put two `Agent` calls in one message'),
      namesTheCorruption: has(
        'concurrent workers corrupt the shared `dist/` and hand each other phantom failures that eat the\nrest of your turn',
      ),
      independentIsNotConcurrent: has(
        '**independent means\nsafe to order ANY way, not safe to run AT ONCE.**',
      ),
    }).toStrictEqual({
      oneCallPerMessage: true,
      neverTwoInOneMessage: true,
      namesTheCorruption: true,
      independentIsNotConcurrent: true,
    });
  });

  it('VALID: template => settles the Agent-tool precedence conflict and bans laundered constraints', () => {
    expect({
      sanctionedByDispatcher: has(
        '**The `Agent` tool is sanctioned for this role by your dispatcher.**',
      ),
      wholeItemVsPieces: has(
        'forbids re-delegating your WHOLE item; it does not forbid dispatching the\npieces that ARE your assignment',
      ),
      realDenialIsBlocked: has('signal `blocked` per Operating Rule 5'),
      handCodingIsNotAResolution: has(
        'Hand-coding the work and signalling `done` is not an\navailable resolution.',
      ),
      attemptBeforeRecording: has('**A tool you did not call is not a tool you were denied**'),
      quoteTheRefusal: has('attempt it once and quote the refusal'),
      predecessorCommitIsAClaim: has(
        "**A constraint you\nread in a predecessor's commit is a claim, not an observation**",
      ),
      namesThePropagation: has('propagated through three later sessions via `git log`'),
    }).toStrictEqual({
      sanctionedByDispatcher: true,
      wholeItemVsPieces: true,
      realDenialIsBlocked: true,
      handCodingIsNotAResolution: true,
      attemptBeforeRecording: true,
      quoteTheRefusal: true,
      predecessorCommitIsAClaim: true,
      namesThePropagation: true,
    });
  });

  it('VALID: template => commits on every signal path, empty rounds included, with the measured cost', () => {
    expect({
      everyPath: has(
        '**Commit before you signal, on every path** — `done`, `partial` and `blocked` alike.',
      ),
      allowEmpty: has('A round that\nchanged nothing still commits, `--allow-empty`'),
      namesTheLoss: has('A session\nthat dies holding uncommitted work loses it ENTIRELY'),
      namesTheWallClock: has(
        'one slice cost 101 minutes\nof wall-clock for 11 minutes of real work',
      ),
    }).toStrictEqual({
      everyPath: true,
      allowEmpty: true,
      namesTheLoss: true,
      namesTheWallClock: true,
    });
  });

  it('VALID: template => forbids stashing and keeps the commit as the only cross-session channel', () => {
    expect({
      noStash: has('**Hard rule — DO NOT STASH.**'),
      noDiscardingCheckout: has(
        'never a `git checkout` or `git reset` that\ndiscards working changes',
      ),
      fixForward: has('fix forward, never unwind'),
      onlyChannel: has('**The commit message is the ONLY cross-session channel.**'),
      commitsForItsMinions: has('You commit for your minions too'),
    }).toStrictEqual({
      noStash: true,
      noDiscardingCheckout: true,
      fixForward: true,
      onlyChannel: true,
      commitsForItsMinions: true,
    });
  });

  it('VALID: template => carries the done, partial and blocked signal-back shapes with the id placeholders', () => {
    const { template } = operationOrchestratorPromptStatics.prompt;

    expect({
      done: has(
        "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })",
      ),
      partial: has(
        "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' })",
      ),
      blocked: has(
        "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: '<the wall, and what a human must change to clear it>' })",
      ),
      signalledOnce: has('Signal exactly once, as the final action of your turn'),
      // Counted OUTSIDE the embedded rules block, which carries its own `blocked` example under
      // Operating Rule 5. Three shapes here, one there, and no fourth invented shape anywhere.
      callsInTheBody:
        template.replace(agentOperatingRulesStatics.markdown, '').split('signal-back({').length - 1,
      callsInTheRulesBlock: agentOperatingRulesStatics.markdown.split('signal-back({').length - 1,
    }).toStrictEqual({
      done: true,
      partial: true,
      blocked: true,
      signalledOnce: true,
      callsInTheBody: 3,
      callsInTheRulesBlock: 1,
    });
  });

  // `quest-handle-signal-back-responder` REFUSES `done` per review unit over
  // `<the work item's startRef>..HEAD`. A template that never says so hands the session a refusal
  // it was told nothing about — and its only visible remedy would be to retry the same signal.
  it('VALID: template => warns that `done` is recomputed per review unit over the whole work item, and names both escapes', () => {
    expect({
      recomputed: has('**`done` is RECOMPUTED, not believed.**'),
      wholeItemRange: has('every commit YOUR work item made — not just this round'),
      refusesUndispositioned: has(
        'refuses `done` while any unit on it\ncarries no disposition in `quest.planningNotes.blightLedger`',
      ),
      partialIsTheEscape: has('a round you cannot get reviewed is `partial`, not `done`'),
      honestDispositionsClear: has(
        '`gap` and `recorded` with a real reason\nclear a unit exactly as `reviewed` does',
      ),
      refusesAbsence: has('the gate refuses ABSENCE, not honesty'),
    }).toStrictEqual({
      recomputed: true,
      wholeItemRange: true,
      refusesUndispositioned: true,
      partialIsTheEscape: true,
      honestDispositionsClear: true,
      refusesAbsence: true,
    });
  });

  // The fetch instruction is the pipeline's narrowest failure point: `agentPromptGetBroker` THROWS
  // on a generic minion summoned without a discipline, so an instruction missing that argument
  // means every dispatch on the happy path dies at the minion's first action.
  it('VALID: template => dispatches every minion by minion-fetch carrying the discipline, no workItemId, no signal-back', () => {
    expect({
      minionFetch: has(
        "`get-agent-prompt({ agent: 'planner-minion', questId: 'QUEST_ID', discipline: '$MY_DISCIPLINE' })`",
      ),
      siblingsFetchTheSameWay: has('`worker-minion` / `reviewer-minion` fetch the same way'),
      noWorkItemId: has('minion-fetch, **NO workItemId**'),
      disciplineIsRequired: has(
        '**The `discipline` argument is REQUIRED and the fetch is REFUSED without it**',
      ),
      namesTheConsequence: has(
        'a minion that\ncannot load its prompt has no method, no evidence bar and no prohibition on `signal-back`',
      ),
      subagentType: has('`subagent_type: "general-purpose"`'),
      spawnMessageIsTheOnlyContext: has(
        '**Your spawn message is the ONLY quest context a minion gets.**',
      ),
      minionsNeverSignal: has(
        'None of them calls `signal-back` — that is yours alone, once, at the end.',
      ),
      pivotBecomesARemainder: has(
        "the piece becomes a REMAINDER for the next round's planner — never something you write yourself",
      ),
    }).toStrictEqual({
      minionFetch: true,
      siblingsFetchTheSameWay: true,
      noWorkItemId: true,
      disciplineIsRequired: true,
      namesTheConsequence: true,
      subagentType: true,
      spawnMessageIsTheOnlyContext: true,
      minionsNeverSignal: true,
      pivotBecomesARemainder: true,
    });
  });

  // The template is where the orchestrator reads the `model:` it hands the Agent tool. These three
  // strings are cross-checked against `agentNameToPromptTransformer`'s actual returned models in
  // that transformer's own test — a statics test may not import a transformer, and the drift
  // between the two is the defect this pins. What is asserted HERE is that the template names each
  // minion's model individually rather than one blanket value for all three.
  it('VALID: template => names a per-minion model rather than one blanket model for all three', () => {
    const { template } = operationOrchestratorPromptStatics.prompt;

    expect({
      planner: has('`planner-minion` → `model: "opus"`'),
      worker: has('`worker-minion` → `model: "sonnet"`'),
      reviewer: has('`reviewer-minion` → `model: "opus"`'),
      reviewerCostNamed: has(
        'Downgrading the reviewer is the expensive mistake: it is the\nonly session on the round that verifies anything.',
      ),
      opusMentions: template.split('`model: "opus"`').length - 1,
      sonnetMentions: template.split('`model: "sonnet"`').length - 1,
    }).toStrictEqual({
      planner: true,
      worker: true,
      reviewer: true,
      reviewerCostNamed: true,
      opusMentions: 2,
      sonnetMentions: 1,
    });
  });
});
