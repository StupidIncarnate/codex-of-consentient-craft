import { InstanceKilledError } from './instance-killed-error';

describe('InstanceKilledError', () => {
  describe('construction', () => {
    it('VALID: {instanceId} => names the instance and points at a fresh start', () => {
      const error = new InstanceKilledError({ instanceId: 'inst_7f3a9c21' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InstanceKilledError',
        message:
          'Instance inst_7f3a9c21 was killed. There is no driver left to run steps against — ' +
          'start a fresh instance with dungeonmaster siegelense start instead.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof InstanceKilledError => returns true', () => {
      const error = new InstanceKilledError({ instanceId: 'inst_7f3a9c21' });

      expect(error instanceof InstanceKilledError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new InstanceKilledError({ instanceId: 'inst_7f3a9c21' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
