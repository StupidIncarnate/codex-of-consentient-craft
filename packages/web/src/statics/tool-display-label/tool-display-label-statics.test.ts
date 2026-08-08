import { toolDisplayLabelStatics } from './tool-display-label-statics';

describe('toolDisplayLabelStatics', () => {
  describe('shape', () => {
    it('VALID: {statics} => exposes the command-name budget and the tool keys it reads', () => {
      expect(toolDisplayLabelStatics).toStrictEqual({
        maxCommandWords: 3,
        bashToolName: 'Bash',
        skillToolName: 'Skill',
        skillFieldKey: 'skill',
        commandFieldKey: 'command',
        unknownSkillLabel: 'unknown',
      });
    });
  });
});
