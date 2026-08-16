import { agentOperatingRulesStatics } from './agent-operating-rules-statics';

describe('agentOperatingRulesStatics', () => {
  it('VALID: exported value => has a work-item markdown string and two minion variants', () => {
    expect(agentOperatingRulesStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
      delegatingMinionMarkdown: expect.stringMatching(/^.+$/su),
      leafMinionMarkdown: expect.stringMatching(/^.+$/su),
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

  it('VALID: markdown => names the ward snippet it overrides, so the conflict resolves explicitly', () => {
    const needle =
      'This rule OVERRIDES the `<dungeonmaster-ward>` snippet you were handed at session start: its "make it fully green" line is written for an agent working directly for the user, and you are not one.';
    const { markdown } = agentOperatingRulesStatics;
    const found = markdown.slice(
      markdown.indexOf(needle),
      markdown.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: markdown => keeps the universal ward mechanics by reference instead of restating them', () => {
    const needle =
      'the build-first, one-mode and run-once mechanics in the `<dungeonmaster-ward-discipline>` snippet apply to you unchanged';
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

  describe('delegatingMinionMarkdown', () => {
    it('VALID: delegatingMinionMarkdown => starts with the same Operating Rules heading', () => {
      const needle = '## Operating Rules — READ FIRST (ignoring these wedges the whole quest)';
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;

      expect(delegatingMinionMarkdown.slice(0, needle.length)).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => Rule 1 FORBIDS signal-back instead of mandating it', () => {
      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;
      const found = delegatingMinionMarkdown.slice(
        delegatingMinionMarkdown.indexOf(needle),
        delegatingMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => carries no "ALWAYS call signal-back" mandate to contradict Rule 1', () => {
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;

      expect(delegatingMinionMarkdown.indexOf('ALWAYS call `signal-back`')).toBe(-1);
    });

    it('VALID: delegatingMinionMarkdown => shows no signal-back call example a minion could copy', () => {
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;

      expect(delegatingMinionMarkdown.indexOf('signal-back({')).toBe(-1);
    });

    it('VALID: delegatingMinionMarkdown => routes an environment wall to UNFIXABLE in the artifact, not a signal', () => {
      const needle =
        "Name the wall and what a human must change under `UNFIXABLE` in your return; the parent decides whether that becomes an `operationStatus: 'blocked'` for the whole quest.";
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;
      const found = delegatingMinionMarkdown.slice(
        delegatingMinionMarkdown.indexOf(needle),
        delegatingMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => shares the background-task rule verbatim with the work-item variant', () => {
      const needle =
        '**2. NEVER end your turn waiting for a background task, and NEVER poll for one.**';
      const { markdown, delegatingMinionMarkdown } = agentOperatingRulesStatics;

      expect(
        delegatingMinionMarkdown.slice(
          delegatingMinionMarkdown.indexOf(needle),
          delegatingMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
      expect(
        markdown.slice(markdown.indexOf(needle), markdown.indexOf(needle) + needle.length),
      ).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => shares the ward-scope rule verbatim with the work-item variant', () => {
      const needle =
        '**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo `npm run ward`.**';
      const { markdown, delegatingMinionMarkdown } = agentOperatingRulesStatics;

      expect(
        delegatingMinionMarkdown.slice(
          delegatingMinionMarkdown.indexOf(needle),
          delegatingMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
      expect(
        markdown.slice(markdown.indexOf(needle), markdown.indexOf(needle) + needle.length),
      ).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => Rule 4 permits a bounded spike on a genuinely net-new pattern', () => {
      const needle =
        'a SPIKE, and only a spike — trying a pattern nobody in this repo has built yet, so you find out whether it works BEFORE you commit a plan to it';
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;
      const found = delegatingMinionMarkdown.slice(
        delegatingMinionMarkdown.indexOf(needle),
        delegatingMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: delegatingMinionMarkdown => Rule 4 forbids delegating the whole assignment and passing a spike through as-is', () => {
      const needle =
        "You may NOT delegate your whole assignment to a helper, and a spike's result is never passed through as your own output: read what it found, decide what it means, and fold that decision into YOUR plan in your own words.";
      const { delegatingMinionMarkdown } = agentOperatingRulesStatics;
      const found = delegatingMinionMarkdown.slice(
        delegatingMinionMarkdown.indexOf(needle),
        delegatingMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });
  });

  describe('leafMinionMarkdown', () => {
    it('VALID: leafMinionMarkdown => starts with the same Operating Rules heading', () => {
      const needle = '## Operating Rules — READ FIRST (ignoring these wedges the whole quest)';
      const { leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(leafMinionMarkdown.slice(0, needle.length)).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => Rule 1 FORBIDS signal-back instead of mandating it', () => {
      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
      const { leafMinionMarkdown } = agentOperatingRulesStatics;
      const found = leafMinionMarkdown.slice(
        leafMinionMarkdown.indexOf(needle),
        leafMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => carries no "ALWAYS call signal-back" mandate to contradict Rule 1', () => {
      const { leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(leafMinionMarkdown.indexOf('ALWAYS call `signal-back`')).toBe(-1);
    });

    it('VALID: leafMinionMarkdown => shows no signal-back call example a minion could copy', () => {
      const { leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(leafMinionMarkdown.indexOf('signal-back({')).toBe(-1);
    });

    it('VALID: leafMinionMarkdown => routes an environment wall to UNFIXABLE in the artifact, not a signal', () => {
      const needle =
        "Name the wall and what a human must change under `UNFIXABLE` in your return; the parent decides whether that becomes an `operationStatus: 'blocked'` for the whole quest.";
      const { leafMinionMarkdown } = agentOperatingRulesStatics;
      const found = leafMinionMarkdown.slice(
        leafMinionMarkdown.indexOf(needle),
        leafMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => shares the background-task rule verbatim with the work-item variant', () => {
      const needle =
        '**2. NEVER end your turn waiting for a background task, and NEVER poll for one.**';
      const { markdown, leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(
        leafMinionMarkdown.slice(
          leafMinionMarkdown.indexOf(needle),
          leafMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
      expect(
        markdown.slice(markdown.indexOf(needle), markdown.indexOf(needle) + needle.length),
      ).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => shares the ward-scope rule verbatim with the work-item variant', () => {
      const needle =
        '**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo `npm run ward`.**';
      const { markdown, leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(
        leafMinionMarkdown.slice(
          leafMinionMarkdown.indexOf(needle),
          leafMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
      expect(
        markdown.slice(markdown.indexOf(needle), markdown.indexOf(needle) + needle.length),
      ).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => Rule 4 bans the Agent/Task tool outright, replacing the synchronous-delegation text', () => {
      const needle = '**4. You are a LEAF. Do NOT call the `Agent`/Task tool.**';
      const { leafMinionMarkdown } = agentOperatingRulesStatics;
      const found = leafMinionMarkdown.slice(
        leafMinionMarkdown.indexOf(needle),
        leafMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: leafMinionMarkdown => tells the leaf to report an unreachable piece and let the parent decide', () => {
      const needle =
        'If your piece genuinely cannot be done without work outside it, say so in your return and let your parent decide.';
      const { leafMinionMarkdown } = agentOperatingRulesStatics;
      const found = leafMinionMarkdown.slice(
        leafMinionMarkdown.indexOf(needle),
        leafMinionMarkdown.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });
  });

  it.each([
    '**1. NEVER call `signal-back` — your final message IS your terminal action.**',
    '**2. NEVER end your turn waiting for a background task, and NEVER poll for one.**',
    '**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo `npm run ward`.**',
    '**5. When the wall is the ENVIRONMENT, not the work, report it — do not work around it.**',
  ])(
    'VALID: delegatingMinionMarkdown and leafMinionMarkdown => share rule %s verbatim',
    (needle) => {
      const { delegatingMinionMarkdown, leafMinionMarkdown } = agentOperatingRulesStatics;

      expect(
        delegatingMinionMarkdown.slice(
          delegatingMinionMarkdown.indexOf(needle),
          delegatingMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
      expect(
        leafMinionMarkdown.slice(
          leafMinionMarkdown.indexOf(needle),
          leafMinionMarkdown.indexOf(needle) + needle.length,
        ),
      ).toBe(needle);
    },
  );

  it('VALID: delegatingMinionMarkdown and leafMinionMarkdown => diverge on Rule 4, the delegation rule', () => {
    const { delegatingMinionMarkdown, leafMinionMarkdown } = agentOperatingRulesStatics;

    expect(
      delegatingMinionMarkdown.indexOf('**4. You are a LEAF. Do NOT call the `Agent`/Task tool.**'),
    ).toBe(-1);
    expect(leafMinionMarkdown.indexOf('a SPIKE, and only a spike')).toBe(-1);
  });
});
