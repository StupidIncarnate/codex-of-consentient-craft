import { summaryStreamLineContract } from './summary-stream-line-contract';
import { SummaryStreamLineStub } from './summary-stream-line.stub';

describe('summaryStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {summary with text} => parses correctly', () => {
      const streamLine = SummaryStreamLineStub();

      const result = summaryStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'summary',
        summary: 'Built login flow with OAuth',
      });
    });

    it('VALID: {custom summary text} => parses with override', () => {
      const streamLine = SummaryStreamLineStub({ summary: 'Refactored auth module' as never });

      const result = summaryStreamLineContract.parse(streamLine);

      expect(result.summary).toBe('Refactored auth module');
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID_TYPE: {type: "result"} => throws validation error', () => {
      expect(() => {
        summaryStreamLineContract.parse({
          type: 'result',
          summary: 'some summary',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_MISSING: {missing summary} => throws validation error', () => {
      expect(() => {
        summaryStreamLineContract.parse({
          type: 'summary',
        });
      }).toThrow(/Required/u);
    });
  });
});
