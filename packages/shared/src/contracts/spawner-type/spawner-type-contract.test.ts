import { spawnerTypeContract } from './spawner-type-contract';
import { SpawnerTypeStub } from './spawner-type.stub';

describe('spawnerTypeContract', () => {
  describe('valid types', () => {
    it('VALID: agent => parses successfully', () => {
      const type = SpawnerTypeStub({ value: 'agent' });

      const result = spawnerTypeContract.parse(type);

      expect(result).toBe('agent');
    });

    it('VALID: command => parses successfully', () => {
      const type = SpawnerTypeStub({ value: 'command' });

      const result = spawnerTypeContract.parse(type);

      expect(result).toBe('command');
    });

    it('VALID: {default} => defaults to agent', () => {
      const type = SpawnerTypeStub();

      expect(type).toBe('agent');
    });
  });

  describe('invalid types', () => {
    it('INVALID: unknown type => throws validation error', () => {
      expect(() => {
        spawnerTypeContract.parse('unknown_type');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
