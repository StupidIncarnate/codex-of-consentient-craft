import { StreamJsonToClarificationStub } from './stream-json-to-clarification.stub';
import { streamJsonToClarificationContract } from './stream-json-to-clarification-contract';

describe('streamJsonToClarificationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = StreamJsonToClarificationStub();

      expect(streamJsonToClarificationContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questions: wrong type} => throws', () => {
      expect(() =>
        streamJsonToClarificationContract.parse({
          ...StreamJsonToClarificationStub(),
          questions: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
