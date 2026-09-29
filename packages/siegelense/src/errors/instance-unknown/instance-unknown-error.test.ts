import { InstanceUnknownError } from './instance-unknown-error';

describe('InstanceUnknownError', () => {
  describe('constructor()', () => {
    it('VALID: {instanceId: "inst_deadbeef"} => sets name and full message', () => {
      const error = new InstanceUnknownError({ instanceId: 'inst_deadbeef' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InstanceUnknownError',
        message:
          'No record of the instance id "inst_deadbeef". Check the id that `dungeonmaster siegelense start` returned.',
      });
    });

    it('EDGE: {instanceId: "inst_00000000"} => names that exact id in the message', () => {
      const error = new InstanceUnknownError({ instanceId: 'inst_00000000' });

      expect(error.message).toBe(
        'No record of the instance id "inst_00000000". Check the id that `dungeonmaster siegelense start` returned.',
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof InstanceUnknownError => returns true', () => {
      const error = new InstanceUnknownError({ instanceId: 'inst_deadbeef' });

      expect(error instanceof InstanceUnknownError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new InstanceUnknownError({ instanceId: 'inst_deadbeef' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
