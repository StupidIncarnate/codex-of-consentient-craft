import { codeweaverMinionStatics } from './codeweaver-minion-statics';

describe('codeweaverMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(codeweaverMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => declares it is summoned by Codeweaver in the opening line', () => {
    const needle =
      'You are a codeweaver-minion. Codeweaver summoned you (via the Agent tool) to implement ONE isolated piece of its slice';
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares it has no work item and returns an artifact instead of signal-back', () => {
    const needle = '**You are a sub-agent with NO work item of your own.**';
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a "What you return" distilled-artifact section', () => {
    expect(codeweaverMinionStatics.prompt.template).toMatch(
      /^## What you return \(the distilled artifact, NOT a transcript\)$/mu,
    );
  });

  it('VALID: template => wires into named already-built pieces but leaves broader reconciliation to Codeweaver', () => {
    const needle = 'that broader reconciliation is Codeweaver';
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = codeweaverMinionStatics.prompt;

    const blocking = '**Load project standards FIRST (BLOCKING).**';

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

  it('VALID: template => mandates writing the failing test first (TDD)', () => {
    const needle = '**Write the failing test first.**';
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Briefing section ends with $ARGUMENTS placeholder', () => {
    expect(codeweaverMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => loads discover + project-map/inventory/quest in the same first ToolSearch batch as the standards tools', () => {
    const needle =
      "in the SAME first `ToolSearch` batch as the standards tools above, so you don't pay a second `ToolSearch` round-trip later.";
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = codeweaverMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
