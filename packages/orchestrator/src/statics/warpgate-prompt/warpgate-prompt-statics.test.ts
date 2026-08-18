import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { warpgatePromptStatics } from './warpgate-prompt-statics';

describe('warpgatePromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(warpgatePromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(warpgatePromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(warpgatePromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames Warpgate as a merge relay worker', () => {
    expect(warpgatePromptStatics.prompt.template).toMatch(/^# Warpgate - Merge Relay Worker$/mu);
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git fetch and git push', () => {
    const needle =
      "- No `git fetch` — the base branch you compare against is read from the quest, never from\n  origin.\n- No `git push` — landing the merge on the local base branch finishes the job; publishing it is\n  the user's decision, made outside this session.";
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids git stash', () => {
    const needle =
      "- No `git stash` — never hide work behind a stash, yours or the repo root checkout's.";
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  // Rule 3 (embedded in this same prompt) says NEVER run the whole-repo `npm run ward`, and Rule 2
  // says a command the harness auto-backgrounds strands the turn. This role is the one legitimate
  // exception — a base merge can break files outside the quest's own, which a scoped run cannot
  // see — so the exception and the background-mode it requires have to be stated here, not left to
  // whichever rule the session reads first.
  it('VALID: template => names its whole-repo ward as the deliberate exception to Rule 3, run in background mode', () => {
    const { template } = warpgatePromptStatics.prompt;

    expect({
      wholeRepo: template.includes('`npm run ward`, whole-repo, no\n`--only` and no paths'),
      isTheException: template.includes(
        '**This is a deliberate exception to Operating Rule 3 above, and the only\none on the quest**',
      ),
      namesWhyScopedCannotWork: template.includes(
        "a BASE MERGE did not break something outside the quest's\nown files, which a scoped run cannot see",
      ),
      runsItRule2sWay: template.includes(
        "run it Rule 2's sanctioned way — `run_in_background: true`, then wait for the task notification and\nread the output once",
      ),
      neverSleepAndTail: template.includes('Never `sleep`-and-tail.'),
    }).toStrictEqual({
      wholeRepo: true,
      isTheException: true,
      namesWhyScopedCannotWork: true,
      runsItRule2sWay: true,
      neverSleepAndTail: true,
    });
  });

  it('VALID: template => reads the exit code of the full-mode ward run and branches on it', () => {
    const needle =
      '**Read its exit code and branch on it — a conforming\nrun does not just invoke ward and move on:**';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => no merge into base happens while ward is red', () => {
    const needle =
      '  base merge broke is exactly the open-ended work you were launched to do. No merge into the base\n  branch happens while ward is red: the base branch tip stays exactly where it started for as\n  long as ward is red.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => intake merges base into the quest branch before the work ever moves onto base', () => {
    const needle =
      'Only once the branch\nis green does the work move onto base, so base never receives an unproven merge.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => skips intake and the full ward run when base is already an ancestor', () => {
    const needle =
      'Skip step 2\n  AND step 3 entirely, and go straight to step 4 (the repo root checkout).';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => moves to the repo root checkout because base cannot live in two worktrees at once', () => {
    const needle =
      'The base branch cannot be checked out in two worktrees at once, so base lives at the repo root —\nmove there for the rest of the job.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the base merge runs with cwd equal to the repo root checkout, never the worktree', () => {
    const needle =
      'Every git command in this step runs with cwd equal to the repo root checkout, never the\nworktree.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => commits the merged-and-repaired branch with a message beginning warpgate:', () => {
    const needle =
      'The worktree must be clean before the merge into the base branch begins. Commit the intake merge\nand every repair with a message beginning `warpgate:`.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => a blocked signal names the specific files it could not resolve', () => {
    const needle =
      'NAMING THE SPECIFIC FILES: the unreconcilable\npaths for a conflict you could not resolve, or the uncommitted repo-root paths that would have\nbeen destroyed by checking out base.';
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = warpgatePromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(warpgatePromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
