import { tavernkeeperPromptStatics } from './tavernkeeper-prompt-statics';

describe('tavernkeeperPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(tavernkeeperPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
        },
      },
    });
  });
});
