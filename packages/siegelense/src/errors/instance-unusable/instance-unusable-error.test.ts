import { InstanceUnusableError } from './instance-unusable-error';

describe('InstanceUnusableError', () => {
  describe('constructor()', () => {
    it('VALID: {instanceId: "inst_7f3a9c21"} => sets name and full message', () => {
      const error = new InstanceUnusableError({ instanceId: 'inst_7f3a9c21' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InstanceUnusableError',
        message:
          "Instance inst_7f3a9c21 is unusable: a seed step failed mid-batch on an earlier run, leaving it partially seeded with nothing to roll back to. Continuing to drive it would turn that one failure into a round's worth of wrong findings — start a fresh instance with dungeonmaster siegelense start instead.",
      });
    });

    it('EDGE: {instanceId: "inst_00000000"} => names that exact id in the message', () => {
      const error = new InstanceUnusableError({ instanceId: 'inst_00000000' });

      expect(error.message).toBe(
        "Instance inst_00000000 is unusable: a seed step failed mid-batch on an earlier run, leaving it partially seeded with nothing to roll back to. Continuing to drive it would turn that one failure into a round's worth of wrong findings — start a fresh instance with dungeonmaster siegelense start instead.",
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof InstanceUnusableError => returns true', () => {
      const error = new InstanceUnusableError({ instanceId: 'inst_7f3a9c21' });

      expect(error instanceof InstanceUnusableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new InstanceUnusableError({ instanceId: 'inst_7f3a9c21' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
