import { agentOperatingRulesStatics } from './agent-operating-rules-statics';

describe('agentOperatingRulesStatics', () => {
  it('VALID: exported value => has a markdown string', () => {
    expect(agentOperatingRulesStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  it('VALID: markdown => starts with the Operating Rules heading', () => {
    const needle = '## Operating Rules — READ FIRST (ignoring these wedges the whole quest)';
    const { markdown } = agentOperatingRulesStatics;

    expect(markdown.slice(0, needle.length)).toBe(needle);
  });

  it('VALID: markdown => mandates calling signal-back as the final action every turn', () => {
    const needle = '**1. ALWAYS call `signal-back` as the final action of your turn.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => forbids ending the turn waiting for a background task', () => {
    const needle = '**2. NEVER end your turn waiting for a background task.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => scopes ward to changed files and keeps it in the foreground', () => {
    const needle = '**3. Run ward SCOPED to what you changed, ALWAYS in the foreground.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => clarifies the Agent/Task tool is synchronous and awaiting a helper is allowed', () => {
    const needle =
      '**4. The `Agent`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
