import { responderAnnotationContract } from './responder-annotation-contract';
import { ResponderAnnotationStub } from './responder-annotation.stub';

describe('responderAnnotationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses with null suffix and empty childLines', () => {
      const result = ResponderAnnotationStub();

      expect(result).toStrictEqual({
        suffix: null,
        childLines: [],
      });
    });

    it('VALID: {suffix only} => parses with null suffix replaced', () => {
      const result = ResponderAnnotationStub({
        suffix: '[POST /api/x]',
      });

      expect(result).toStrictEqual({
        suffix: '[POST /api/x]',
        childLines: [],
      });
    });

    it('VALID: {childLines only} => parses with non-empty childLines', () => {
      const result = ResponderAnnotationStub({
        childLines: ['← packages/web (fooBroker)'],
      });

      expect(result).toStrictEqual({
        suffix: null,
        childLines: ['← packages/web (fooBroker)'],
      });
    });

    it('VALID: {suffix + childLines} => parses with both populated', () => {
      const result = ResponderAnnotationStub({
        suffix: '[GET /api/x]',
        childLines: [
          '← packages/web (a)',
          '← packages/web (b)',
        ],
      });

      expect(result).toStrictEqual({
        suffix: '[GET /api/x]',
        childLines: ['← packages/web (a)', '← packages/web (b)'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing childLines} => throws ZodError', () => {
      expect(() =>
        responderAnnotationContract.parse({
          suffix: null,
        }),
      ).toThrow(/received undefined/u);
    });

    it('INVALID: {missing suffix} => throws ZodError', () => {
      expect(() =>
        responderAnnotationContract.parse({
          childLines: [],
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
