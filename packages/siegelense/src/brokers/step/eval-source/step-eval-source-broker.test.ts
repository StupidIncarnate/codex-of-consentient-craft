import { stepEvalSourceBroker } from './step-eval-source-broker';
import { stepEvalSourceBrokerProxy } from './step-eval-source-broker.proxy';

describe('stepEvalSourceBroker', () => {
  describe('evaluation', () => {
    it('VALID: {source} => drives session.evaluateSource with the source and returns its stringified value', async () => {
      const proxy = stepEvalSourceBrokerProxy();
      const { session, getEvaluateSourceCalls } = proxy.sessionEvaluating({
        evaluated: '"Guild Hall"',
      });

      const result = await stepEvalSourceBroker({ session, source: '() => document.title' });

      expect(getEvaluateSourceCalls()).toStrictEqual([[{ source: '() => document.title' }]]);
      expect(result).toBe('"Guild Hall"');
    });
  });
});
