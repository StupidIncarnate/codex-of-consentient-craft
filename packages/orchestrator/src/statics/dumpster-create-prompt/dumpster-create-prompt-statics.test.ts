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
});
