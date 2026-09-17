import { agentsHooksConfigContract } from './agents-hooks-config-contract';
import { AgentsHooksConfigStub } from './agents-hooks-config.stub';

describe('agentsHooksConfigContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgentsHooksConfigStub();

    expect(result).toHaveProperty('dungeonmaster-guard');
  });

  it('INVALID: {missing dungeonmaster-guard} => throws validation error', () => {
    expect(() => {
      return agentsHooksConfigContract.parse({} as never);
    }).toThrow();
  });
});
