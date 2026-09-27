import { adapterResultContract } from './adapter-result-contract';
import { AdapterResultStub as _AdapterResultStub } from './adapter-result.stub';

describe('adapterResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true} => parses successfully', () => {
      const result = adapterResultContract.parse({ success: true });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {success: false} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse({ success: false });
      }).toThrow('Invalid input: expected');
    });

    it('INVALID: {empty object} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse({});
      }).toThrow('Invalid input: expected');
    });

    it('INVALID: {success: "true"} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse({ success: 'true' });
      }).toThrow('Invalid input: expected');
    });

    it('INVALID: {null} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse(null);
      }).toThrow('Invalid input: expected object, received null');
    });

    it('INVALID: {undefined} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse(undefined);
      }).toThrow('received undefined');
    });
  });
});
