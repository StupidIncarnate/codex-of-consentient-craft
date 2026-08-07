import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightwardenDeadcodeMinionStatics } from './blightwarden-deadcode-minion-statics';

describe('blightwardenDeadcodeMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenDeadcodeMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true });
  });

  it('VALID: template => has a Briefing section heading', () => {
    expect(blightwardenDeadcodeMinionStatics.prompt.template).toMatch(/^## Briefing$/mu);
  });

  it('VALID: template => declares it runs ONE sweep over the whole diff, alone, after every other minion', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const opener =
      "You are a blightwarden-deadcode-minion. The Blightwarden parent summoned you (via the Agent tool) to run ONE sweep over this quest's WHOLE diff for code that nothing uses";

    expect(template.slice(template.indexOf(opener), template.indexOf(opener) + opener.length)).toBe(
      opener,
    );

    const alone =
      'after every group minion and the crosscut minion have finished and their edits have landed on disk. You run ALONE: no other minion is active, so there is nothing left to collide with.';

    expect(template.slice(template.indexOf(alone), template.indexOf(alone) + alone.length)).toBe(
      alone,
    );
  });

  it('VALID: template => has no work item, never signals back, and never writes the blight ledger', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const noWorkItem = '**You are a sub-agent with NO work item of your own.**';

    expect(
      template.slice(
        template.indexOf(noWorkItem),
        template.indexOf(noWorkItem) + noWorkItem.length,
      ),
    ).toBe(noWorkItem);

    const noLedger =
      'You do NOT write `quest.planningNotes.blightLedger` — you own no review unit, so there is no disposition for you to record.';

    expect(
      template.slice(template.indexOf(noLedger), template.indexOf(noLedger) + noLedger.length),
    ).toBe(noLedger);

    const artifactIsTerminal = '**return a distilled artifact as your final message**';

    expect(
      template.slice(
        template.indexOf(artifactIsTerminal),
        template.indexOf(artifactIsTerminal) + artifactIsTerminal.length,
      ),
    ).toBe(artifactIsTerminal);
  });

  it('VALID: template => states why dead code needs the whole import graph and cannot be a per-file concern', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const cannotTell = '**A file cannot tell you whether its own export has a consumer.**';

    expect(
      template.slice(
        template.indexOf(cannotTell),
        template.indexOf(cannotTell) + cannotTell.length,
      ),
    ).toBe(cannotTell);

    const separatePass =
      'That fact is the whole reason you exist as a separate pass instead of a per-file concern on the review cross-product.';

    expect(
      template.slice(
        template.indexOf(separatePass),
        template.indexOf(separatePass) + separatePass.length,
      ),
    ).toBe(separatePass);

    const answerElsewhere = 'the answer lives in every OTHER file in the monorepo';

    expect(
      template.slice(
        template.indexOf(answerElsewhere),
        template.indexOf(answerElsewhere) + answerElsewhere.length,
      ),
    ).toBe(answerElsewhere);
  });

  it('VALID: template => states why it runs last: a fix landed by an earlier wave can itself orphan an export', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const needle =
      "Every fix the earlier waves landed can itself orphan something: a consolidated duplicate leaves the loser's export with no callers";

    expect(template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length)).toBe(
      needle,
    );

    const graphNow =
      'The import graph you need is the one that exists AFTER all of that, which is the one on disk right now.';

    expect(
      template.slice(template.indexOf(graphNow), template.indexOf(graphNow) + graphNow.length),
    ).toBe(graphNow);
  });

  it.each([
    '**Orphaned exports**',
    '**Dead files**',
    '**Unreachable branches**',
    '**Commented-out code**',
    '**Unused parameters and variables**',
    '**Anything the diff added that nothing calls**',
  ])('VALID: template => charter covers %s', (needle) => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    expect(template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length)).toBe(
      needle,
    );
  });

  it('VALID: template => sources the diff from get-blight-checklist, not a hand-rolled git diff', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const checklist =
      "Call `get-blight-checklist({ questId })` for the current changed-file list. It is measured from the quest's pinned `baseRef`";

    expect(
      template.slice(template.indexOf(checklist), template.indexOf(checklist) + checklist.length),
    ).toBe(checklist);

    const forbidden = '**Do NOT run `git diff <main-or-master>...HEAD` to find your scope.**';

    expect(
      template.slice(template.indexOf(forbidden), template.indexOf(forbidden) + forbidden.length),
    ).toBe(forbidden);
  });

  it('VALID: template => never ORDERS a default-branch diff anywhere', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    expect(template.indexOf('Run `git diff <main-or-master>...HEAD --name-only`')).toBe(-1);
  });

  it('VALID: template => exempts root barrel files from the orphan verdict', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const needle =
      '**Root barrel files** — `packages/*/contracts.ts`, `brokers.ts`, `guards.ts`, `statics.ts`, and their siblings exist precisely to export things ACROSS workspace boundaries.';

    expect(template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length)).toBe(
      needle,
    );
  });

  it('VALID: template => exempts startup/start-install.ts, which the CLI dynamically imports with no static importer', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const needle =
      '**`startup/start-install.ts` files** — the CLI discovers `packages/*/dist/startup/start-install.js` at runtime and dynamically imports each `StartInstall`. There is NO static importer anywhere, by design. Never orphan one.';

    expect(template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length)).toBe(
      needle,
    );
  });

  it('VALID: template => exempts symbols referenced only from a .claude hook or an npm script', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const hooks = '**Anything referenced only from `.claude/`**';

    expect(template.slice(template.indexOf(hooks), template.indexOf(hooks) + hooks.length)).toBe(
      hooks,
    );

    const scripts = '**Anything referenced only from an npm script**';

    expect(
      template.slice(template.indexOf(scripts), template.indexOf(scripts) + scripts.length),
    ).toBe(scripts);
  });

  it('VALID: template => declares itself a placeholder for a deterministic tool such as knip', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const heading = '## You are a placeholder for a deterministic tool';

    expect(
      template.slice(template.indexOf(heading), template.indexOf(heading) + heading.length),
    ).toBe(heading);

    const knip =
      'This pass SHOULD be a deterministic orphan-export tool — `knip` or equivalent — wired into ward, computing the real import graph and reporting the exact set. That tool is not in this repo yet.';

    expect(template.slice(template.indexOf(knip), template.indexOf(knip) + knip.length)).toBe(knip);
  });

  it('VALID: template => requires the search that found no consumer alongside every claimed orphan', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const showWork = '**every claim you make must carry the search that produced it.**';

    expect(
      template.slice(template.indexOf(showWork), template.indexOf(showWork) + showWork.length),
    ).toBe(showWork);

    const noGuess =
      'A claim with no search behind it is not a finding; leave it out rather than guess.';

    expect(
      template.slice(template.indexOf(noGuess), template.indexOf(noGuess) + noGuess.length),
    ).toBe(noGuess);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const blocking = 'Load project standards FIRST (BLOCKING)';

    expect(
      template.slice(template.indexOf(blocking), template.indexOf(blocking) + blocking.length),
    ).toBe(blocking);

    const arch = 'get-architecture';

    expect(template.slice(template.indexOf(arch), template.indexOf(arch) + arch.length)).toBe(arch);

    const syntax = 'get-syntax-rules';

    expect(template.slice(template.indexOf(syntax), template.indexOf(syntax) + syntax.length)).toBe(
      syntax,
    );

    const testing = 'get-testing-patterns';

    expect(
      template.slice(template.indexOf(testing), template.indexOf(testing) + testing.length),
    ).toBe(testing);
  });

  it('VALID: template => runs scoped ward in the foreground with explicit FILE paths, never a bare directory', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const heading = '### 6. Run scoped ward, foreground';

    expect(
      template.slice(template.indexOf(heading), template.indexOf(heading) + heading.length),
    ).toBe(heading);

    const command = 'npm run ward -- -- path/to/file-a.ts path/to/file-a.test.ts path/to/file-b.ts';

    expect(
      template.slice(template.indexOf(command), template.indexOf(command) + command.length),
    ).toBe(command);

    const explicitFiles =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';

    expect(
      template.slice(
        template.indexOf(explicitFiles),
        template.indexOf(explicitFiles) + explicitFiles.length,
      ),
    ).toBe(explicitFiles);
  });

  it('VALID: template => carries a DO NOT STASH hard rule naming the work a stash would swallow', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const hardRule = '**Hard rule — DO NOT STASH.**';

    expect(
      template.slice(template.indexOf(hardRule), template.indexOf(hardRule) + hardRule.length),
    ).toBe(hardRule);

    const whose =
      'Your deletions land on top of everything the group minions and the crosscut minion already fixed; a stash/pop would swallow their work.';

    expect(template.slice(template.indexOf(whose), template.indexOf(whose) + whose.length)).toBe(
      whose,
    );
  });

  it('VALID: template => has a "What you return" distilled-artifact section that pins the search beside each claim', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    expect(template).toMatch(/^## What you return \(the distilled artifact, NOT a transcript\)$/mu);

    const deleted =
      'DELETED:\n  - <path> :: <symbol> — searched: <the discover call> -> <what it returned>';

    expect(
      template.slice(template.indexOf(deleted), template.indexOf(deleted) + deleted.length),
    ).toBe(deleted);
  });

  it('VALID: template => forbids git for ANY purpose, read or write', () => {
    const { template } = blightwardenDeadcodeMinionStatics.prompt;

    const needle = '**Never run `git` — for ANY purpose, read or write.**';

    expect(template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length)).toBe(
      needle,
    );
  });

  it.each(['PathSeeker', 'pathseeker', 'lawbringer', 'Lawbringer'])(
    'VALID: template => carries no reference to %s, which is not a role in this orchestration',
    (needle) => {
      const { template } = blightwardenDeadcodeMinionStatics.prompt;

      expect(template.indexOf(needle)).toBe(-1);
    },
  );

  it.each(['failed-replan', 'signal `failed`'])(
    'VALID: template => carries no reference to the %s signal, which the signal system does not accept',
    (needle) => {
      const { template } = blightwardenDeadcodeMinionStatics.prompt;

      expect(template.indexOf(needle)).toBe(-1);
    },
  );

  describe('minion operating rules', () => {
    it('VALID: template => embeds the minion rules variant, which forbids signal-back', () => {
      const { template } = blightwardenDeadcodeMinionStatics.prompt;

      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';

      expect(
        template.slice(template.indexOf(needle), template.indexOf(needle) + needle.length),
      ).toBe(needle);
    });

    it('VALID: template => carries no "ALWAYS call signal-back" mandate contradicting its no-work-item role', () => {
      const { template } = blightwardenDeadcodeMinionStatics.prompt;

      expect(template.indexOf('ALWAYS call `signal-back`')).toBe(-1);
    });
  });
});
