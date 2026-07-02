import { lawbringerMinionStatics } from './lawbringer-minion-statics';

describe('lawbringerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(lawbringerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => declares it is summoned by the Lawbringer parent in the opening line', () => {
    const needle =
      'You are a lawbringer-minion. The Lawbringer parent summoned you (via the Agent tool) to review and FIX ONE tight group of file pairs';
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares it has no work item and returns an artifact instead of signal-back', () => {
    const needle = '**You are a sub-agent with NO work item of your own.**';
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = lawbringerMinionStatics.prompt;

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

  it('VALID: template => carries the branch-coverage walk (the value lawbringer adds)', () => {
    const needle = 'Branch coverage (the main value lawbringer adds)';
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => may use Edit/Write to fix violations in place', () => {
    const needle = 'You MAY use Edit/Write';
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a "What you return" distilled-artifact section', () => {
    expect(lawbringerMinionStatics.prompt.template).toMatch(
      /^## What you return \(the distilled artifact, NOT a transcript\)$/mu,
    );
  });

  it('VALID: template => Briefing section ends with $ARGUMENTS placeholder', () => {
    expect(lawbringerMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => loads discover + project-map/inventory/quest in the same first ToolSearch batch as the standards tools', () => {
    const needle =
      "in the SAME first `ToolSearch` batch as the standards tools above, so you don't pay a second `ToolSearch` round-trip later.";
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = lawbringerMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
