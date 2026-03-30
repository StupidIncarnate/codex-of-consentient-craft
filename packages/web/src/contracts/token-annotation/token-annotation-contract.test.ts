import { tokenAnnotationContract } from './token-annotation-contract';
import { TokenAnnotationStub } from './token-annotation.stub';
import { FormattedTokenLabelStub } from '../formatted-token-label/formatted-token-label.stub';
import { ContextTokenCountStub } from '../context-token-count/context-token-count.stub';
import { ContextTokenDeltaStub } from '../context-token-delta/context-token-delta.stub';

describe('tokenAnnotationContract', () => {
  describe('valid annotations', () => {
    it('VALID: {all nulls, source session} => parses successfully', () => {
      const annotation = TokenAnnotationStub();

      const result = tokenAnnotationContract.parse(annotation);

      expect(result).toStrictEqual({
        tokenBadgeLabel: null,
        resultTokenBadgeLabel: null,
        cumulativeContext: null,
        contextDelta: null,
        source: 'session',
      });
    });

    it('VALID: {with token badge labels} => parses with labels', () => {
      const annotation = TokenAnnotationStub({
        tokenBadgeLabel: FormattedTokenLabelStub({ value: '2.1k context' }),
        resultTokenBadgeLabel: FormattedTokenLabelStub({ value: '~500 est' }),
      });

      const result = tokenAnnotationContract.parse(annotation);

      expect(result).toStrictEqual({
        tokenBadgeLabel: '2.1k context',
        resultTokenBadgeLabel: '~500 est',
        cumulativeContext: null,
        contextDelta: null,
        source: 'session',
      });
    });

    it('VALID: {all fields populated} => parses complete annotation', () => {
      const annotation = TokenAnnotationStub({
        tokenBadgeLabel: FormattedTokenLabelStub({ value: '29.4k context' }),
        resultTokenBadgeLabel: FormattedTokenLabelStub({ value: '~150 est' }),
        cumulativeContext: ContextTokenCountStub({ value: 29448 }),
        contextDelta: ContextTokenDeltaStub({ value: 2100 }),
        source: 'subagent',
      });

      const result = tokenAnnotationContract.parse(annotation);

      expect(result).toStrictEqual({
        tokenBadgeLabel: '29.4k context',
        resultTokenBadgeLabel: '~150 est',
        cumulativeContext: 29448,
        contextDelta: 2100,
        source: 'subagent',
      });
    });
  });

  describe('invalid annotations', () => {
    it('INVALID: {source: "unknown"} => throws validation error', () => {
      expect(() => {
        tokenAnnotationContract.parse({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: null,
          contextDelta: null,
          source: 'unknown',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing source} => throws validation error', () => {
      expect(() => {
        tokenAnnotationContract.parse({
          tokenBadgeLabel: null,
          resultTokenBadgeLabel: null,
          cumulativeContext: null,
          contextDelta: null,
        });
      }).toThrow(/Required/u);
    });
  });
});
