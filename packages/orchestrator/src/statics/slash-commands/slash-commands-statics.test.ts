import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { dumpsterCreatePromptStatics } from '../dumpster-create-prompt/dumpster-create-prompt-statics';
import { dumpsterHuntPromptStatics } from '../dumpster-hunt-prompt/dumpster-hunt-prompt-statics';
import { slashCommandsStatics } from './slash-commands-statics';

describe('slashCommandsStatics', () => {
  describe('dumpsterCreate', () => {
    it('VALID: dumpsterCreate.fileName => is dumpster-create.md', () => {
      expect(slashCommandsStatics.dumpsterCreate.fileName).toBe('dumpster-create.md');
    });

    it('VALID: dumpsterCreate.body => starts with YAML frontmatter delimiter', () => {
      expect(slashCommandsStatics.dumpsterCreate.body.slice(0, 4)).toBe('---\n');
    });

    it('VALID: dumpsterCreate.body => declares ChaosWhisperer as the spec-conversation description', () => {
      const needle = 'description: Run a Dumpster spec conversation (ChaosWhisperer)';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => allowed-tools line lists mcp__dungeonmaster__* and Task', () => {
      const needle =
        'allowed-tools: mcp__dungeonmaster__*, Bash, Read, Glob, Grep, Edit, Write, Task';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => embeds the dumpster-create prompt template with the mint bootstrap and native clarify instruction substituted', () => {
      const { body } = slashCommandsStatics.dumpsterCreate;
      const expected = dumpsterCreatePromptStatics.prompt.template
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
          dumpsterCreatePromptStatics.questBootstrap.mint,
        )
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
          dumpsterCreatePromptStatics.clarifyInstructions.native,
        );
      const foundIndex = body.indexOf(expected);

      expect(foundIndex).toBeGreaterThan(0);
      expect(body.slice(foundIndex, foundIndex + expected.length)).toBe(expected);
    });

    it('VALID: dumpsterCreate.body => uses the native AskUserQuestion clarify tool, not the MCP tool, with no unresolved placeholder', () => {
      const { body } = slashCommandsStatics.dumpsterCreate;

      expect(body.indexOf('$CLARIFY_INSTRUCTION')).toBe(-1);
      expect(body.indexOf('$QUEST_BOOTSTRAP')).toBe(-1);
      expect(body.indexOf('mcp__dungeonmaster__ask-user-question')).toBe(-1);
      expect(body.indexOf('use the native `AskUserQuestion` tool')).toBeGreaterThan(-1);
    });

    it('VALID: dumpsterCreate.body => contains the create-quest instruction from the chaos prompt', () => {
      const needle = 'call `mcp__dungeonmaster__create-quest` to create the new quest';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => opens the spec view without suppressing the chat panel', () => {
      const { body } = slashCommandsStatics.dumpsterCreate;

      expect(body.indexOf('chat=hidden')).toBe(-1);
    });

    it('VALID: dumpsterCreate.body => contains the get-server-config instruction', () => {
      const needle = 'mcp__dungeonmaster__get-server-config()';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => contains the xdg-open / open Bash fallback', () => {
      const needle = 'xdg-open <url> 2>/dev/null || open <url> 2>/dev/null || true';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => contains the packagesAffected requirement from the chaos prompt', () => {
      const needle = '**Declare `packagesAffected[]`**';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => packagesAffected entries use the object shape, not bare strings', () => {
      const needle = 'Each entry is an object, not a bare string:';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => contains the node package tagging instruction from the chaos prompt', () => {
      const needle =
        'Tag every node with `packages: PackageName[]` as you create it — see "Node package tagging"';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => contains the seam-rule invariant for every edge A -> B', () => {
      const needle =
        '**For every edge `A -> B`, `A.packages` and `B.packages` must share at least one package.**';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => carries the observable package field with its resolve-on-save rule', () => {
      const needle = '**Omit it when that node tags exactly one package**';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterCreate.body => assigns Playwright ownership to Groundstomper alone, never Siegemaster', () => {
      const needle =
        'Groundstomper owns Playwright and only Playwright; Flowrider owns the integration and unit suites below the browser.';
      const { body } = slashCommandsStatics.dumpsterCreate;
      const foundIndex = body.indexOf(needle);

      expect(body.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
      expect(body.indexOf('Siegemaster Playwright')).toBe(-1);
    });

    it('VALID: dumpsterCreate.body => no longer contains the three-step wrapper trailer line', () => {
      const removedNeedle = 'Continue the spec conversation per the chaoswhisperer prompt.';
      const { body } = slashCommandsStatics.dumpsterCreate;

      expect(body.indexOf(removedNeedle)).toBe(-1);
    });

    it('VALID: dumpsterCreate.body => no longer instructs calling get-agent-prompt for chaoswhisperer', () => {
      const removedNeedle = 'mcp__dungeonmaster__get-agent-prompt({ agent: "chaoswhisperer" })';
      const { body } = slashCommandsStatics.dumpsterCreate;

      expect(body.indexOf(removedNeedle)).toBe(-1);
    });
  });

  describe('dumpsterHunt', () => {
    it('VALID: dumpsterHunt.fileName => is dumpster-hunt.md', () => {
      expect(slashCommandsStatics.dumpsterHunt.fileName).toBe('dumpster-hunt.md');
    });

    it('VALID: dumpsterHunt.fileName => matches the registry intake filename for bug-hunt', () => {
      expect(slashCommandsStatics.dumpsterHunt.fileName).toBe(
        questTypeRegistryStatics['bug-hunt'].intakeSlashCommandFileName,
      );
    });

    it('VALID: dumpsterHunt.body => starts with YAML frontmatter delimiter', () => {
      expect(slashCommandsStatics.dumpsterHunt.body.slice(0, 4)).toBe('---\n');
    });

    it('VALID: dumpsterHunt.body => declares BugHunt as the intake description', () => {
      const needle = 'description: Run a Dumpster bug-hunt intake (BugHunt)';
      const { body } = slashCommandsStatics.dumpsterHunt;
      const foundIndex = body.indexOf(needle);

      expect(body.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: dumpsterHunt.body => embeds the dumpster-hunt prompt with mint + native substituted', () => {
      const { body } = slashCommandsStatics.dumpsterHunt;
      const { template, placeholders } = dumpsterHuntPromptStatics.prompt;
      const expected = template
        .replace(placeholders.questBootstrap, dumpsterHuntPromptStatics.questBootstrap.mint)
        .replace(
          placeholders.clarifyInstruction,
          dumpsterHuntPromptStatics.clarifyInstructions.native,
        );
      const foundIndex = body.indexOf(expected);

      expect(body.slice(foundIndex, foundIndex + expected.length)).toBe(expected);
    });

    it('VALID: dumpsterHunt.body => leaves no unsubstituted placeholders', () => {
      const { body } = slashCommandsStatics.dumpsterHunt;
      const { placeholders } = dumpsterHuntPromptStatics.prompt;

      expect([
        body.indexOf(placeholders.questBootstrap),
        body.indexOf(placeholders.clarifyInstruction),
      ]).toStrictEqual([-1, -1]);
    });

    it('VALID: dumpsterHunt.body => instructs create-quest with questType bug-hunt', () => {
      const needle = "questType: 'bug-hunt'";
      const { body } = slashCommandsStatics.dumpsterHunt;
      const foundIndex = body.indexOf(needle);

      expect(body.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: dumpsterHunt.body => contains the node package tagging instruction from the bug-hunt prompt', () => {
      const needle = 'Tag every node with `packages: PackageName[]` as you create it';
      const { body } = slashCommandsStatics.dumpsterHunt;
      const foundIndex = body.indexOf(needle);

      expect(body.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: dumpsterHunt.body => carries the observable package field with its resolve-on-save rule', () => {
      const needle = '**Omit it when that node tags exactly one package**';
      const { body } = slashCommandsStatics.dumpsterHunt;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterHunt.body => packagesAffected entries use the object shape with the ./ location prefix', () => {
      const needle =
        "`location` written\nWITH the `./` prefix (`'./packages/<name>'`, never the bare `'packages/<name>'`)";
      const { body } = slashCommandsStatics.dumpsterHunt;
      const foundIndex = body.indexOf(needle);

      expect(body.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });

  describe('dumpsterLaunch', () => {
    it('VALID: dumpsterLaunch.fileName => is dumpster-launch.md', () => {
      expect(slashCommandsStatics.dumpsterLaunch.fileName).toBe('dumpster-launch.md');
    });

    it('VALID: dumpsterLaunch.body => starts with YAML frontmatter delimiter', () => {
      expect(slashCommandsStatics.dumpsterLaunch.body.slice(0, 4)).toBe('---\n');
    });

    it('VALID: dumpsterLaunch.body => ends with the loop-back instruction line and newline', () => {
      const tail = '3. Loop back to 1.\n';
      const { body } = slashCommandsStatics.dumpsterLaunch;

      expect(body.slice(body.length - tail.length)).toBe(tail);
    });

    it('VALID: dumpsterLaunch.body => no longer instructs calling register-monitor-session', () => {
      const removedNeedle = 'register-monitor-session';
      const { body } = slashCommandsStatics.dumpsterLaunch;

      expect(body.indexOf(removedNeedle)).toBe(-1);
    });

    it('VALID: dumpsterLaunch.body => has no Startup section', () => {
      const { body } = slashCommandsStatics.dumpsterLaunch;

      expect(body.indexOf('Startup:')).toBe(-1);
    });

    it('VALID: dumpsterLaunch.body => instructs calling get-next-step with no arguments', () => {
      const needle = 'mcp__dungeonmaster__get-next-step()';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterLaunch.body => allowed-tools line lists mcp__dungeonmaster__*, Task, Bash', () => {
      const needle = 'allowed-tools: mcp__dungeonmaster__*, Task, Bash';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterLaunch.body => instructs calling run-ward with questId/workItemId/mode', () => {
      const needle =
        'mcp__dungeonmaster__run-ward({ questId: result.questId, workItemId: result.workItemId, mode: result.mode })';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterLaunch.body => idle branch instructs a backgrounded Bash sleep 1800', () => {
      const needle = 'Bash `sleep 1800`** with `run_in_background: true`';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterLaunch.body => idle branch forbids ScheduleWakeup and other timer mechanisms', () => {
      const needle = 'do NOT use ScheduleWakeup, a cron, or any other wakeup/timer mechanism';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: dumpsterLaunch.body => idle branch instructs stopping when result.reason is present', () => {
      const needle =
        'FIRST check `result.reason` — if present, the queue is owned by another dispatcher';
      const { body } = slashCommandsStatics.dumpsterLaunch;
      const foundIndex = body.indexOf(needle);
      const foundSlice = body.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });
});
