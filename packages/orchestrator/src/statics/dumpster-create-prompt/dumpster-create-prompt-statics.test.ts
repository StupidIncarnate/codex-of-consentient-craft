import { dumpsterCreatePromptStatics } from './dumpster-create-prompt-statics';

describe('dumpsterCreatePromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(dumpsterCreatePromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
        },
      },
    });
  });

  it('VALID: prompt template => length exceeds 30000 characters', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.length).toBeGreaterThan(30000);
  });

  it('VALID: prompt template => Phase 5 no longer instructs calling validate-spec MCP tool', () => {
    const removedNeedle = 'Run validate-spec first';
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf(removedNeedle)).toBe(-1);
  });

  it('VALID: prompt template => documents modify-quest validation layers', () => {
    const needle = '`modify-quest` validates on every call.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires packagesAffected[] declaration before approval', () => {
    const needle = '**Declare `packagesAffected[]`**';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => documents that packagesAffected is read by the work-item insertion broker at Start Quest', () => {
    const needle =
      'The work-item insertion broker reads this list at Start Quest time to fan out per-package `pathseeker-surface` work items';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs ChaosWhisperer to create the quest as its first action', () => {
    const needle = 'call `mcp__dungeonmaster__create-quest` to create the new quest';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs passing the user request verbatim as the userRequest arg to create-quest', () => {
    const needle = "passing the user's original request verbatim as the `userRequest` argument";
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs opening the web UI spec view with chat hidden after quest creation', () => {
    const needle = '?chat=hidden';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs calling get-server-config before opening the URL', () => {
    const needle = 'mcp__dungeonmaster__get-server-config()';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs opening the URL via xdg-open / open Bash fallback', () => {
    const needle = 'xdg-open <url> 2>/dev/null || open <url> 2>/dev/null || true';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => uses native AskUserQuestion tool, not the MCP ask-user-question tool', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf('mcp__dungeonmaster__ask-user-question')).toBe(-1);
    expect(template.indexOf('AskUserQuestion')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => instructs reading AskUserQuestion answers synchronously from the tool result', () => {
    const needle =
      'Answers come back synchronously as the tool result — read them directly from the result before continuing.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => explains that a PostToolUse hook on AskUserQuestion captures design decisions', () => {
    const needle =
      'A `PostToolUse` hook on `AskUserQuestion` reads the tool result, queries the server to find the active quest by session, and PATCHes a `designDecisions[]` entry per answered question onto the quest.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => explains that option label and description become the persisted rationale text', () => {
    const needle =
      'The option `label` and `description` values you write become the persisted `rationale` text on each design decision.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });
});
