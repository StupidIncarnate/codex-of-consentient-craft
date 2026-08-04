import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightwardenMinionStatics } from './blightwarden-minion-statics';

describe('blightwardenMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    const { template } = blightwardenMinionStatics.prompt;

    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: template => declares it is summoned by the Blightwarden parent in the opening line', () => {
    const needle =
      'You are a blightwarden-minion. The Blightwarden parent summoned you (via the Agent tool) to review and FIX ONE tight group of file pairs';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares it has no work item and returns an artifact instead of signal-back', () => {
    const needle = '**You are a sub-agent with NO work item of your own.**';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = blightwardenMinionStatics.prompt;

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

  it('VALID: template => carries the branch-coverage walk (the value this minion adds)', () => {
    const needle = 'Branch coverage (the main value this adds)';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it.each([
    'Concern: coverage',
    'Concern: craft',
    'Concern: security',
    'Concern: dedup',
    'Concern: perf',
    'Concern: integrity',
    'Concern: dead-code',
  ])('VALID: template => %s section is present', (needle) => {
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the dead-code concern repoints correctness judgment to the craft concern, not a lawbringer', () => {
    const needle =
      "If reachable but probably wrong, that's the `craft` concern above, not this one.";
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the security concern covers per-file AND cross-file taint, not cross-file only', () => {
    const needle = 'This covers per-file AND cross-file taint';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => may use Edit/Write to fix violations in place', () => {
    const needle = 'You MAY use Edit/Write — fixing the violations you find IS your job.';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => narrows fix authority: hand up architectural fixes, cross-group work, and product decisions', () => {
    const needle =
      'Hand up architectural fixes, anything crossing groups, and anything needing a product decision';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => records each disposition as it goes, not batched to the end', () => {
    const needle =
      'Record as you go, do NOT batch to the end — a session that dies at pair four loses every disposition it earned';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => every disposition clears a unit, including gap and recorded', () => {
    const needle =
      'Every disposition clears a unit — `gap` (the concern cannot be assessed at this layer, with a stated reason) and `recorded` (a real finding handed to a named owner) included. The completion gate refuses absence, not honesty';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the disposition write is a modify-quest call against planningNotes.blightLedger', () => {
    const needle = "modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: [";
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a "What you return" distilled-artifact section', () => {
    expect(blightwardenMinionStatics.prompt.template).toMatch(
      /^## What you return \(the distilled artifact, NOT a transcript\)$/mu,
    );
  });

  it('VALID: template => Briefing section ends with $ARGUMENTS placeholder', () => {
    expect(blightwardenMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => loads discover + project-map/inventory/quest in the same first ToolSearch batch as the standards tools', () => {
    const needle =
      "in the SAME first `ToolSearch` batch as the standards tools above, so you don't pay a second `ToolSearch` round-trip later.";
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => an unfixable finding is carried forward via the parent partial continuation, not a failure signal', () => {
    const needle =
      'The parent decides whether to fix it itself or carry it forward in its commit handoff for the `partial` continuation.';
    const { template } = blightwardenMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no lawbringer mention (the fold is complete)', () => {
    const { template } = blightwardenMinionStatics.prompt;

    expect(template.indexOf('lawbringer')).toBe(-1);
    expect(template.indexOf('Lawbringer')).toBe(-1);
  });

  it('VALID: template => the report-only tool restriction from the source minions did not survive the fold', () => {
    const { template } = blightwardenMinionStatics.prompt;

    expect(template.indexOf('MUST NOT use Edit, Write')).toBe(-1);
  });

  it('VALID: template => carries no stale planning-model or legacy-signal references', () => {
    const { template } = blightwardenMinionStatics.prompt;

    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf('signal `failed`')).toBe(-1);
  });

  describe('git prohibition', () => {
    it('VALID: template => forbids git for ANY purpose, read or write', () => {
      const needle = '**Never run `git` — for ANY purpose, read or write.**';
      const { template } = blightwardenMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => the git ban is not phrased as an absolute followed only by write verbs', () => {
      const { template } = blightwardenMinionStatics.prompt;

      expect(
        template.indexOf(
          '**Never run `git` at all — no `commit`, no `add`, no `stash`, no `checkout`, no `reset`.**',
        ),
      ).toBe(-1);
    });

    it('VALID: template => never orders a default-branch diff for scope', () => {
      const { template } = blightwardenMinionStatics.prompt;

      expect(template.indexOf('git diff <main-or-master>...HEAD --name-only')).toBe(-1);
    });
  });

  describe('minion operating rules', () => {
    it('VALID: template => embeds the minion rules variant, which forbids signal-back', () => {
      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
      const { template } = blightwardenMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => carries no "ALWAYS call signal-back" mandate contradicting its no-work-item role', () => {
      const { template } = blightwardenMinionStatics.prompt;

      expect(template.indexOf('ALWAYS call `signal-back`')).toBe(-1);
    });
  });
});
