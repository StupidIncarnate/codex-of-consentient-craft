import { driverRequestKindContract } from './driver-request-kind-contract';
import { DriverRequestKindStub } from './driver-request-kind.stub';

describe('driverRequestKindContract', () => {
  describe('valid members', () => {
    it.each(driverRequestKindContract.options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const kind = DriverRequestKindStub({ value });

        const result = driverRequestKindContract.parse(kind);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "status"} => an unlisted string throws validation error', () => {
      expect(() => {
        DriverRequestKindStub({ value: 'status' });
      }).toThrow(/Invalid option/u);
    });
  });
});
