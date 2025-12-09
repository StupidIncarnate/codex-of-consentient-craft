import { dungeonmasterHooksConfigContract } from './dungeonmaster-hooks-config-contract';
import { DungeonmasterHooksConfigStub } from './dungeonmaster-hooks-config.stub';

describe('dungeonmasterHooksConfigContract', () => {
  it('VALID: {with preEditLint} => parses successfully', () => {
    const result = DungeonmasterHooksConfigStub();

    expect(result.preEditLint?.rules[0]).toBe('@dungeonmaster/enforce-project-structure');
  });

  it('VALID: {without preEditLint} => parses successfully', () => {
    const result = DungeonmasterHooksConfigStub({ preEditLint: undefined });

    expect(result.preEditLint).toBeUndefined();
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return dungeonmasterHooksConfigContract.parse('invalid' as never);
      }).toThrow(/Expected object/u);
    });
  });
});
