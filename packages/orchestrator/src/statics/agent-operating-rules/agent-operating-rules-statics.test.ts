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
    const needle =
      '**2. NEVER end your turn waiting for a background task, and NEVER poll for one.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => scopes ward to changed files and keeps it in the foreground', () => {
    const needle =
      '**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo `npm run ward`.**';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => forbids a bare-directory ward scope and requires explicit file paths', () => {
    const needle =
      'Those `<paths>` MUST be explicit FILE paths (`-- <file1> <file2>`), NEVER a bare directory (`-- packages/<pkg>`)';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => warns a sub-agent that a backgrounded ward yields no wakeup', () => {
    const needle =
      'a minion or sub-agent that kicks off a broad `npm run ward` (whole-repo OR a bare `-- packages/<pkg>` directory) will watch it get auto-backgrounded and then hang forever';
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

  it("VALID: markdown => routes an environment wall to operationStatus 'blocked' instead of partial", () => {
    const needle =
      "**5. When the wall is the ENVIRONMENT, not the work, signal `operationStatus: 'blocked'` — never `partial`.**";
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => names a denied command as a hard denial with no approver, not a prompt', () => {
    const needle =
      "a command outside the project's permission allowlist comes back `This command requires approval` and is DENIED outright, not queued for someone to accept";
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => warns that partial spawns a successor that hits the identical wall', () => {
    const needle =
      'it costs a pt-chain attempt and spawns exactly the successor that will fail the same way';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => shows a blocked signal-back call carrying a blockedReason', () => {
    const needle =
      "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: 'git commit is denied in this dispatched session (no approver); add Bash(git commit:*) to .claude/settings.json permissions.allow' })";
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => still requires committing finished work before a blocked signal', () => {
    const needle =
      'Commit whatever you finished first, exactly as you would for `partial` — a blocked quest still hands its work forward through git.';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
