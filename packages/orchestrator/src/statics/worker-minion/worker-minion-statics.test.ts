import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { workerMinionStatics } from './worker-minion-statics';

const has = (needle: string): boolean => workerMinionStatics.prompt.template.includes(needle);

describe('workerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(workerMinionStatics).toStrictEqual({
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
    const { template } = workerMinionStatics.prompt;

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

  it('VALID: template => embeds the minion operating rules, not the work-item variant', () => {
    expect({
      minionVariant: has(agentOperatingRulesStatics.minionMarkdown),
      workItemVariant: has(agentOperatingRulesStatics.markdown),
    }).toStrictEqual({ minionVariant: true, workItemVariant: false });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    expect(workerMinionStatics.prompt.template.length).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  // `tsc` writes one shared `dist/` per package, so a second builder mid-round hands every sibling
  // phantom type errors on correct code. A rule this cheap to break is the FIRST line of the body,
  // not a bullet in a later section — an ordering the assertion pins directly.
  it('VALID: template => forbids npm run build in the first line of the body', () => {
    const { template } = workerMinionStatics.prompt;
    const banHeadline = '**You NEVER run `npm run build`.**';

    expect({
      ban: has(banHeadline),
      parentAlreadyBuilt: has(
        'Your parent already built, and it is the only session on this\nquest allowed to.',
      ),
      namesTheCorruption: has(
        'Two workers building at once corrupt the shared `dist/` and hand every sibling\nphantom type errors on correct code.',
      ),
      escalateInsteadOfBuilding: has(
        'If you believe you need a build, you need your parent — say so\nin your return.',
      ),
      isTheFirstLineOfTheBody: template.indexOf(banHeadline),
      headingLength: '# worker-minion\n\n'.length,
    }).toStrictEqual({
      ban: true,
      parentAlreadyBuilt: true,
      namesTheCorruption: true,
      escalateInsteadOfBuilding: true,
      isTheFirstLineOfTheBody: '# worker-minion\n\n'.length,
      headingLength: '# worker-minion\n\n'.length,
    });
  });

  it('VALID: template => owns exactly ONE plan piece and stays inside its files', () => {
    expect({
      onePiece: has('**exactly\nONE piece**'),
      briefNamesTheFields: has(
        'its `intent`, the `files` it OWNS, the `folderTypes` per file, the `unitIds` it must satisfy',
      ),
      stayInside: has('**Stay inside your piece.**'),
      wiresIntoNamedPieces: has('that connection is\npart of your assignment'),
      noReplanning: has('Do NOT re-plan the round, invent work beyond the brief'),
      namesLastWriteWins: has(
        'a sibling piece owns those, and last-write-wins is how two workers undo\neach other',
      ),
      reportsOutOfBoundsNeeds: has('say so in your return\ninstead of reaching for it'),
    }).toStrictEqual({
      onePiece: true,
      briefNamesTheFields: true,
      stayInside: true,
      wiresIntoNamedPieces: true,
      noReplanning: true,
      namesLastWriteWins: true,
      reportsOutOfBoundsNeeds: true,
    });
  });

  it('VALID: template => is a leaf — no git, no Agent, no whole-repo ward', () => {
    expect({
      section: /^## What is not yours$/mu.test(workerMinionStatics.prompt.template),
      noGitAtAll: has('**`git`, at all**'),
      namesEveryGitVerb: has('no `commit`, no `add`, no `stash`, no `checkout`, no `reset`'),
      parentOwnsTheCommit: has("Your parent makes the round's ONE commit"),
      leavesFilesUncommitted: has('Leave your files on\n  disk, uncommitted'),
      noAgent: has('**The `Agent` tool** — you are a LEAF.'),
      namesTheGrandchildCost: has('Spawning a helper produces conclusions no gate ever reads'),
      noFullWard: has('**The whole-repo `npm run ward`** — that is the dispatcher'),
    }).toStrictEqual({
      section: true,
      noGitAtAll: true,
      namesEveryGitVerb: true,
      parentOwnsTheCommit: true,
      leavesFilesUncommitted: true,
      noAgent: true,
      namesTheGrandchildCost: true,
      noFullWard: true,
    });
  });

  it('VALID: template => loads the standards itself before opening any code', () => {
    expect({
      blocking: has('**Load the project standards YOURSELF (BLOCKING).**'),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
      folderDetailPerType: has('`get-folder-detail` for EVERY folder type in your brief'),
      oneToolSearchBatch: has('Batch them into ONE `ToolSearch` call'),
      namesTheAnchoringCost: has(
        'Exploring code first anchors you on patterns you\n   cannot yet evaluate and reproduces violations you cannot see.',
      ),
    }).toStrictEqual({
      blocking: true,
      architecture: true,
      syntax: true,
      testing: true,
      folderDetailPerType: true,
      oneToolSearchBatch: true,
      namesTheAnchoringCost: true,
    });
  });

  it('VALID: template => drives the piece red-first and demands a behavioural failure', () => {
    expect({
      failingCheckFirst: has('**Write the failing check first**'),
      drivenByUnitIds: has('driven by the `unitIds` in your brief'),
      wouldFailIfAbsent: has('an\n   assertion that would fail if the behaviour were absent'),
      behaviouralRed: has('**Watch it fail BEHAVIOURALLY.**'),
      wrongValueNotImportError: has('confirm the failure is a WRONG VALUE, not an import error'),
      structuralRedProvesNothing: has('A structural red\n   proves nothing about the assertion.'),
    }).toStrictEqual({
      failingCheckFirst: true,
      drivenByUnitIds: true,
      wouldFailIfAbsent: true,
      behaviouralRed: true,
      wrongValueNotImportError: true,
      structuralRedProvesNothing: true,
    });
  });

  // A bare directory scope pulls in the whole package, gets auto-backgrounded, and strands a turn
  // that has no wakeup — the parent stays blocked on a message that never arrives.
  it('VALID: template => runs scoped ward on explicit FILE paths with a narrowed --only', () => {
    expect({
      scopedForeground: has('**Run SCOPED ward, foreground.**'),
      invocation: has('`npm run ward -- --only <checks> -- <your files>`'),
      timeout: has('`timeout: 600000`'),
      explicitFilePaths: has('Those paths MUST be explicit FILE paths'),
      namesTheDirectoryTrap: has(
        'a bare directory\n   (`-- packages/<pkg>`) pulls in the whole package, runs long, gets auto-backgrounded, and strands\n   your turn with no wakeup',
      ),
      narrowNeverWiden: has('a `DISCOVERY MISMATCH` is answered by narrowing, never by widening'),
      fixUntilZero: has('Fix until it exits 0'),
    }).toStrictEqual({
      scopedForeground: true,
      invocation: true,
      timeout: true,
      explicitFilePaths: true,
      namesTheDirectoryTrap: true,
      narrowNeverWiden: true,
      fixUntilZero: true,
    });
  });

  // The return is the parent's ONLY view of this piece: it never opens the files. A transcript
  // instead of an artifact is what makes a round unroutable.
  it('VALID: template => returns a distilled artifact keyed by the plan piece id', () => {
    expect({
      heading: /^## What you return \(the distilled artifact, NOT a transcript\)$/mu.test(
        workerMinionStatics.prompt.template,
      ),
      pieceLine: has('PIECE: <the plan piece id from your brief>'),
      resultLine: has("RESULT: <one line — is the piece's intent now TRUE?>"),
      filesLine: has('FILES: <every path you created or changed>'),
      usageLine: has('USAGE:'),
      gotchasLine: has('GOTCHAS:'),
      wardLine: has('WARD: <green, scoped to the files above, with the exact invocation>'),
      unfixableLine: has('UNFIXABLE:'),
      honestFailure: has(
        '**Do not fake a green ward and do not report a check you did\nnot run.**',
      ),
      namesThePivotCost: has(
        'Your parent pivots on an honest return; it cannot pivot on a plausible one.',
      ),
    }).toStrictEqual({
      heading: true,
      pieceLine: true,
      resultLine: true,
      filesLine: true,
      usageLine: true,
      gotchasLine: true,
      wardLine: true,
      unfixableLine: true,
      honestFailure: true,
      namesThePivotCost: true,
    });
  });
});
