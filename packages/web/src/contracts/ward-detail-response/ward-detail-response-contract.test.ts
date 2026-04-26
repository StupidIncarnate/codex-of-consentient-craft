import { wardDetailResponseContract } from './ward-detail-response-contract';
import { WardDetailResponseStub } from './ward-detail-response.stub';

describe('wardDetailResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {type, wardResultId, detail} => parses successfully', () => {
      const response = WardDetailResponseStub();

      const result = wardDetailResponseContract.parse(response);

      expect(result).toStrictEqual({
        type: 'ward-detail-response',
        wardResultId: 'a47ac10b-58cc-4372-a567-0e02b2c3d999',
        detail: {},
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {wrong type} => throws validation error', () => {
      expect(() => {
        wardDetailResponseContract.parse({
          type: 'something-else',
          wardResultId: 'r-1',
          detail: {},
        });
      }).toThrow(/invalid_literal/u);
    });
  });
});
