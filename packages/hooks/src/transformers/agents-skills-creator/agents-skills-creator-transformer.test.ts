import { agentsSkillsCreatorTransformer } from './agents-skills-creator-transformer';

describe('agentsSkillsCreatorTransformer', () => {
  it('VALID: creates skills config => mounts .claude/skills in entries', () => {
    const result = agentsSkillsCreatorTransformer();

    expect(result).toStrictEqual({
      entries: [
        {
          path: '.claude/skills',
        },
      ],
    });
  });
});
