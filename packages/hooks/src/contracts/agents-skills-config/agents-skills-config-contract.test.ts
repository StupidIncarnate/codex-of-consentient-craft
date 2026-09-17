import { agentsSkillsConfigContract } from './agents-skills-config-contract';
import { AgentsSkillsConfigStub } from './agents-skills-config.stub';

describe('agentsSkillsConfigContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgentsSkillsConfigStub();

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.path).toBe('.claude/skills');
  });

  it('INVALID: {missing entries} => throws validation error', () => {
    expect(() => {
      return agentsSkillsConfigContract.parse({} as never);
    }).toThrow();
  });
});
