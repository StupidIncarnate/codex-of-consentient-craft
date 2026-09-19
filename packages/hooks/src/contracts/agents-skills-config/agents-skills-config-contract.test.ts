import { agentsSkillsConfigContract } from './agents-skills-config-contract';
import { AgentsSkillsConfigStub } from './agents-skills-config.stub';

describe('agentsSkillsConfigContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgentsSkillsConfigStub();

    expect(result).toStrictEqual({
      entries: [{ path: '.claude/skills' }],
    });
  });

  it('INVALID: {missing entries} => throws validation error', () => {
    expect(() => {
      return agentsSkillsConfigContract.parse({} as never);
    }).toThrow(/Required/u);
  });
});
