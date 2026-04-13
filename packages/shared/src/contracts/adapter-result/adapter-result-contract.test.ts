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
      }).toThrow('Invalid literal value');
    });

    it('INVALID: {empty object} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse({});
      }).toThrow('Invalid literal value');
    });

    it('INVALID: {success: "true"} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse({ success: 'true' });
      }).toThrow('Invalid literal value');
    });

    it('INVALID: {null} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse(null);
      }).toThrow('Expected object');
    });

    it('INVALID: {undefined} => throws ZodError', () => {
      expect(() => {
        return adapterResultContract.parse(undefined);
      }).toThrow('Required');
    });
  });
});
