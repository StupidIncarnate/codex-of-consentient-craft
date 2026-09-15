import { portRoleContract } from './port-role-contract';
import { PortRoleStub } from './port-role.stub';

describe('portRoleContract', () => {
  describe('valid members', () => {
    it.each(portRoleContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const portRole = PortRoleStub({ value });

        const result = portRoleContract.parse(portRole);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "database"} => an unlisted string throws validation error', () => {
      expect(() => {
        PortRoleStub({ value: 'database' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "API"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => portRoleContract.parse('API')).toThrow(/Invalid enum value/u);
    });
  });
});
