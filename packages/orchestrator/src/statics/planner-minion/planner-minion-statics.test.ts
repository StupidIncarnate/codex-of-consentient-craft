import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { plannerMinionStatics } from './planner-minion-statics';

const has = (needle: string): boolean => plannerMinionStatics.prompt.template.includes(needle);

describe('plannerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(plannerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          discipline: '$DISCIPLINE',
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries $DISCIPLINE once and $ARGUMENTS once, with $ARGUMENTS last', () => {
    const { template } = plannerMinionStatics.prompt;

    expect({
      disciplineCount: template.split('$DISCIPLINE').length - 1,
      argumentsCount: template.split('$ARGUMENTS').length - 1,
      disciplineOnItsOwnLine: /^\$DISCIPLINE$/mu.test(template),
      argumentsOnItsOwnLine: /^\$ARGUMENTS$/mu.test(template),
      disciplineComesFirst: template.indexOf('$DISCIPLINE') < template.indexOf('$ARGUMENTS'),
      argumentsIsTheTail: template.endsWith('$ARGUMENTS'),
      briefingHeading: /^## Briefing$/mu.test(template),
    }).toStrictEqual({
      disciplineCount: 1,
      argumentsCount: 1,
      disciplineOnItsOwnLine: true,
      argumentsOnItsOwnLine: true,
      disciplineComesFirst: true,
      argumentsIsTheTail: true,
      briefingHeading: true,
    });
  });

  // A minion has no work item of its own: the minion variant is what forbids `signal-back`, and the
  // work-item variant would mandate it on the PARENT's item, advancing the relay mid-round.
  it('VALID: template => embeds the minion operating rules, not the work-item variant', () => {
    expect({
      minionVariant: has(agentOperatingRulesStatics.minionMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
    }).toStrictEqual({ minionVariant: true, workItemVariant: false });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(plannerMinionStatics.prompt.template.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  it('VALID: template => writes no implementation and no tests', () => {
    expect({
      writesNeither: has('**You write NO implementation and NO tests.**'),
      typingCodeMeansWrongRole: has(
        'If you are typing product code, you are a worker, not\na planner.',
      ),
    }).toStrictEqual({ writesNeither: true, typingCodeMeansWrongRole: true });
  });

  it('VALID: template => loads the standards itself and plans against real code', () => {
    expect({
      blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
      folderDetail: has('`get-folder-detail`'),
      oneToolSearchBatch: has('SAME first `ToolSearch` batch'),
      readsRealCode: has('**Read the real code before you plan against it.**'),
      neverTheSpecAlone: has('**Plan against\n   reality, never against the spec alone**'),
      namesTheSpecOnlyFailure: has(
        'a plan written off the spec names files that do not\n   exist, signatures that changed, and seams somebody already built',
      ),
    }).toStrictEqual({
      blocking: true,
      architecture: true,
      syntax: true,
      testing: true,
      folderDetail: true,
      oneToolSearchBatch: true,
      readsRealCode: true,
      neverTheSpecAlone: true,
      namesTheSpecOnlyFailure: true,
    });
  });

  // It is the ONLY minion allowed to delegate, and only for a spike. A leaf minion that spawns
  // helpers produces conclusions no gate reads, because the parent verifies FILES, not summaries.
  it('VALID: template => allows sub-agents only for a net-new spike, and keeps the spike', () => {
    expect({
      onlyForASpike: has('**Spike ONLY a genuinely net-new pattern.**'),
      onlyMinionAllowed: has(
        'You are the ONLY minion permitted to spawn its own\n   sub-agents, and this is the only thing you may spawn one FOR',
      ),
      spikeIsKept: has('**A spike is KEPT, not thrown away**'),
      spikeIsNamedInNotes: has('the piece that owns it names it in `notes`'),
      readItYourselfOtherwise: has(
        'If you find yourself\n   spawning a helper to read files for you, read them yourself.',
      ),
    }).toStrictEqual({
      onlyForASpike: true,
      onlyMinionAllowed: true,
      spikeIsKept: true,
      spikeIsNamedInNotes: true,
      readItYourselfOtherwise: true,
    });
  });

  it('VALID: template => sizes a piece to one worker and names the skim failure mode', () => {
    expect({
      oneWorkerEach: has('**Cut the work into PIECES, one worker each, ordered by dependency.**'),
      smallEnoughToHold: has('small\n   enough for ONE worker to hold in full'),
      skimIsInvisible: has(
        '**An over-large piece gets skimmed, and the skim is invisible in a green run**',
      ),
      namesWhyInvisible: has(
        'the ones it silently dropped were never named, and nothing downstream\n   can tell the difference',
      ),
      errSmall: has('Err small: two tight pieces beat one that needs a table of contents.'),
    }).toStrictEqual({
      oneWorkerEach: true,
      smallEnoughToHold: true,
      skimIsInvisible: true,
      namesWhyInvisible: true,
      errSmall: true,
    });
  });

  // The persisted plan is what the orchestrator reads back, the reviewer verifies against, and a
  // successor inherits. Every field below is consumed by one of those three.
  it('VALID: template => persists the plan through modify-quest planningNotes.operationPlans', () => {
    expect({
      call: has("modify-quest({ questId: 'QUEST_ID', planningNotes: { operationPlans: ["),
      planId: has("id: '<a UUID you generate for this plan>',"),
      operationItemId: has("operationItemId: 'OPERATION_ITEM_ID',"),
      workItemId: has("workItemId: 'WORK_ITEM_ID',"),
      round: has('round: 1,'),
      discipline: has('discipline:'),
      summary: has('summary:'),
      pieces: has('pieces: ['),
      pieceId: has("id: '<a UUID you generate for this piece>',"),
      pieceTitle: has('title:'),
      pieceIntent: has(
        "intent: '<what must be TRUE when this piece is done — an outcome, not a task list>',",
      ),
      pieceFiles: has('files: ['),
      pieceFolderTypes: has('folderTypes: ['),
      pieceUnitIds: has('unitIds: ['),
      pieceDependsOn: has('dependsOn: ['),
      pieceMirror: has('mirror:'),
      pieceNotes: has('notes:'),
      pieceStatus: has("status: 'pending'"),
    }).toStrictEqual({
      call: true,
      planId: true,
      operationItemId: true,
      workItemId: true,
      round: true,
      discipline: true,
      summary: true,
      pieces: true,
      pieceId: true,
      pieceTitle: true,
      pieceIntent: true,
      pieceFiles: true,
      pieceFolderTypes: true,
      pieceUnitIds: true,
      pieceDependsOn: true,
      pieceMirror: true,
      pieceNotes: true,
      pieceStatus: true,
    });
  });

  // An agent-supplied `at` produced fabricated audit data on a real quest — 27 sign-offs stamped
  // with a date that PRECEDED the session, and two batches stamped in a future that never happened.
  it('VALID: template => forbids writing an at field and says the server stamps it', () => {
    expect({
      forbidden: has('**Do NOT write an `at` field.**'),
      serverStamps: has('The server stamps the time'),
      namesTheReason: has('an LLM has no reliable clock'),
    }).toStrictEqual({ forbidden: true, serverStamps: true, namesTheReason: true });
  });

  // The plan is parsed by `operationPlanContract` on the way in. Both ids are UUIDs and both path
  // fields go through `filePathContract`, whose relative branch REQUIRES a `./` prefix — a bare
  // `packages/x/y.ts` matches neither branch and the whole write is rejected.
  it('VALID: template => states the id and path formats the plan contract actually accepts', () => {
    expect({
      idsAreUuids: has('**Every `id` is a UUID you generate**'),
      dependsOnCarriesUuids: has('`dependsOn` carries piece\n  UUIDs, not titles'),
      pathsArePrefixed: has('**`files` and `mirror` must start with `./` or be absolute.**'),
      namesTheRejection: has(
        'A bare `packages/x/y.ts` is REJECTED:\n  it is neither absolute nor prefixed',
      ),
      statusVocabulary: has(
        '`status` is one of `pending | done | rejected` and starts\n  `pending`',
      ),
    }).toStrictEqual({
      idsAreUuids: true,
      dependsOnCarriesUuids: true,
      pathsArePrefixed: true,
      namesTheRejection: true,
      statusVocabulary: true,
    });
  });

  it('VALID: template => states the file-ownership and dependsOn semantics of a piece', () => {
    expect({
      filesAreOwnership: has('`files` is OWNERSHIP: two pieces must never list the same path'),
      overlapMeansOnePiece: has('they are one piece'),
      dependsOnIsOrder: has('`dependsOn` is the dispatch ORDER'),
      notAParallelismHint: has(
        'It is not a parallelism hint — your parent dispatches strictly\n  one worker at a time whatever you write here',
      ),
      unitIdsAreTheReviewersTarget: has('`unitIds` is what the reviewer checks the piece against'),
      optionalFieldsNamed: has('Every other field is required.'),
    }).toStrictEqual({
      filesAreOwnership: true,
      overlapMeansOnePiece: true,
      dependsOnIsOrder: true,
      notAParallelismHint: true,
      unitIdsAreTheReviewersTarget: true,
      optionalFieldsNamed: true,
    });
  });

  it('VALID: template => returns a 3-5 line summary and never the plan body', () => {
    expect({
      capHeading: has('## What you return (3-5 lines, never the plan body)'),
      planLine: has("PLAN: <the operationPlans entry's id> — round <n>, <count> pieces"),
      orderLine: has('ORDER: <piece ids in dependsOn order, one line>'),
      decisionsLine: has('DECISIONS FOR YOU:'),
      riskLine: has('RISK:'),
      spikeLine: has('SPIKE:'),
      neverPaste: has('**Never paste the plan into your return.**'),
      parentReadsItBack: has(
        'Your parent reads it back from the quest with\n`get-quest-planning-notes`',
      ),
      namesTheCost: has(
        'pasting it defeats the whole point of persisting it and burns the\ncontext budget the orchestrator needs to finish the loop',
      ),
      honestEmptyPlan: has('Do not invent pieces to look productive.'),
    }).toStrictEqual({
      capHeading: true,
      planLine: true,
      orderLine: true,
      decisionsLine: true,
      riskLine: true,
      spikeLine: true,
      neverPaste: true,
      parentReadsItBack: true,
      namesTheCost: true,
      honestEmptyPlan: true,
    });
  });
});
