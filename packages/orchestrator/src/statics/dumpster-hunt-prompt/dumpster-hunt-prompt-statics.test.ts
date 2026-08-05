import { dumpsterHuntPromptStatics } from './dumpster-hunt-prompt-statics';

describe('dumpsterHuntPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(dumpsterHuntPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
          questBootstrap: '$QUEST_BOOTSTRAP',
          clarifyInstruction: '$CLARIFY_INSTRUCTION',
        },
      },
      questBootstrap: {
        mint: expect.stringMatching(/^.+$/su),
        preCreated: expect.stringMatching(/^.+$/su),
      },
      clarifyInstructions: {
        native: expect.stringMatching(/^.+$/su),
        mcp: expect.stringMatching(/^.+$/su),
      },
    });
  });

  it('VALID: mint bootstrap => instructs create-quest with questType bug-hunt', () => {
    const needle = "questType: 'bug-hunt'";
    const { mint } = dumpsterHuntPromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);

    expect(mint.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: preCreated bootstrap => forbids minting a second quest', () => {
    const needle = 'Do NOT call `mcp__dungeonmaster__create-quest`';
    const { preCreated } = dumpsterHuntPromptStatics.questBootstrap;
    const foundIndex = preCreated.indexOf(needle);

    expect(preCreated.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: mint bootstrap => opens the spec view without suppressing the chat panel', () => {
    const { mint } = dumpsterHuntPromptStatics.questBootstrap;

    // The intake session's transcript streams into the browser chat panel, so hiding the panel
    // would throw away the conversation the user opened the page to watch.
    expect(mint.indexOf('chat=hidden')).toBe(-1);
  });

  it('VALID: template => references the PestEater agent that fixes after Start', () => {
    const needle = 'PestEater';
    const { template } = dumpsterHuntPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: template => instructs capturing the bug as actual-state and expected-state flows', () => {
    const needle = '**Work:** Capture the bug as TWO flows:';
    const { template } = dumpsterHuntPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: template => anchors the observables on the expected-state flow', () => {
    const needle = 'Walk the expected-state flow and embed observables';
    const { template } = dumpsterHuntPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  describe('multiple observables', () => {
    // An intake that embeds a single observable crams the whole corrected behavior into one
    // then[] as a paragraph of "AND [ui-state] ..." clauses. PestEater cannot turn that into one
    // failing test and the user cannot approve its parts separately, so the prompt must ask for
    // one observable per outcome.
    it('VALID: template => instructs writing as many observables as the behavior has', () => {
      const needle = '**Write as many observables as the corrected behavior actually has.**';
      const { template } = dumpsterHuntPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => instructs splitting multi-part outcomes instead of cramming', () => {
      const needle = '**Split, do not cram.**';
      const { template } = dumpsterHuntPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => never instructs embedding exactly one observable', () => {
      const { template } = dumpsterHuntPromptStatics.prompt;

      expect(template.indexOf('embed ONE\nobservable')).toBe(-1);
    });
  });
});
