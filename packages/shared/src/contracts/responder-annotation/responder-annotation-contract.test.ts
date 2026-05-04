import { responderAnnotationContract } from './responder-annotation-contract';
import { ResponderAnnotationStub } from './responder-annotation.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

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
        suffix: ContentTextStub({ value: '[POST /api/x]' }),
      });

      expect(result).toStrictEqual({
        suffix: '[POST /api/x]',
        childLines: [],
      });
    });

    it('VALID: {childLines only} => parses with non-empty childLines', () => {
      const result = ResponderAnnotationStub({
        childLines: [ContentTextStub({ value: '← packages/web (fooBroker)' })],
      });

      expect(result).toStrictEqual({
        suffix: null,
        childLines: ['← packages/web (fooBroker)'],
      });
    });

    it('VALID: {suffix + childLines} => parses with both populated', () => {
      const result = ResponderAnnotationStub({
        suffix: ContentTextStub({ value: '[GET /api/x]' }),
        childLines: [
          ContentTextStub({ value: '← packages/web (a)' }),
          ContentTextStub({ value: '← packages/web (b)' }),
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
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing suffix} => throws ZodError', () => {
      expect(() =>
        responderAnnotationContract.parse({
          childLines: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
