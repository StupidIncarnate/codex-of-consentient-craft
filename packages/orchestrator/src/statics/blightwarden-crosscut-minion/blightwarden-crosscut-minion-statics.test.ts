import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightwardenCrosscutMinionStatics } from './blightwarden-crosscut-minion-statics';

describe('blightwardenCrosscutMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenCrosscutMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    const { template } = blightwardenCrosscutMinionStatics.prompt;

    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: template => declares it runs the LAST pass over the whole diff, alone', () => {
    const needle =
      "You are a blightwarden-crosscut-minion. The Blightwarden parent summoned you (via the Agent tool) to run the LAST pass over this quest's WHOLE diff";
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => runs after every pair-minion has finished and their edits have landed on disk', () => {
    const needle =
      'after every pair-minion has finished reviewing and fixing its own group of file pairs, and their edits have landed on disk. You run ALONE: no other minion is active, so there is nothing left to collide with.';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares it has no work item and returns an artifact instead of signal-back', () => {
    const needle = '**You are a sub-agent with NO work item of your own.**';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => states the reasoning a pair-scoped minion structurally cannot do: cross-pair duplication', () => {
    const needle =
      "**Duplication across pairs** — two NEW files in this diff, assigned to DIFFERENT pair-minion groups, that do the same thing. Neither group's minion had both files loaded, so neither could catch it.";
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => states the reasoning a pair-scoped minion structurally cannot do: whole-diff blast radius', () => {
    const needle =
      "**Blast radius across the whole diff** — the cumulative effect of every group's changed exports together, not just the exports any one group touched.";
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => fixes freely because no siblings are running to collide with', () => {
    const needle =
      "You MAY use Edit/Write — fix freely. No siblings are running, so nothing you touch can collide with another minion's in-flight work.";
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => does NOT write planningNotes.blightLedger, that stays with the pair minions', () => {
    const needle =
      'You do NOT write `quest.planningNotes.blightLedger` — those per-unit dispositions belong to the pair minions that owned each `(pair, concern)`.';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = blightwardenCrosscutMinionStatics.prompt;

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

  it('VALID: template => loads discover + project-map/inventory/quest in the same first ToolSearch batch as the standards tools', () => {
    const needle =
      "in the SAME first `ToolSearch` batch as the standards tools above, so you don't pay a second `ToolSearch` round-trip later.";
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => re-derives the diff fresh instead of trusting a stale list', () => {
    const needle =
      'Every pair minion before you may have added, changed, or deleted lines. Run `git diff <main-or-master>...HEAD --name-only`';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries a DO NOT STASH hard rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => never runs git at all, the parent owns the single commit', () => {
    const needle =
      '**Never run `git` at all — no `commit`, no `add`, no `stash`, no `checkout`, no `reset`.**';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a "What you return" distilled-artifact section', () => {
    expect(blightwardenCrosscutMinionStatics.prompt.template).toMatch(
      /^## What you return \(the distilled artifact, NOT a transcript\)$/mu,
    );
  });

  it('VALID: template => an unfixable finding is carried forward via the parent partial continuation, not a failure signal', () => {
    const needle =
      'The parent decides whether to fix it itself or carry it forward in its commit handoff for the `partial` continuation.';
    const { template } = blightwardenCrosscutMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Briefing section ends with $ARGUMENTS placeholder', () => {
    expect(blightwardenCrosscutMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => carries no lawbringer mention', () => {
    const { template } = blightwardenCrosscutMinionStatics.prompt;

    expect(template.indexOf('lawbringer')).toBe(-1);
    expect(template.indexOf('Lawbringer')).toBe(-1);
  });

  it('VALID: template => the report-only tool restriction from the source minions did not survive', () => {
    const { template } = blightwardenCrosscutMinionStatics.prompt;

    expect(template.indexOf('MUST NOT use Edit, Write')).toBe(-1);
  });

  it('VALID: template => carries no stale planning-model or legacy-signal references', () => {
    const { template } = blightwardenCrosscutMinionStatics.prompt;

    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf('signal `failed`')).toBe(-1);
  });
});
