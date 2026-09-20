import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../contracts/instance-state/instance-state.stub';
import { ResultsAnswerStub } from '../../contracts/results-answer/results-answer.stub';
import { RunResultStub } from '../../contracts/run-result/run-result.stub';
import { resultsAnswerRenderTransformer } from './results-answer-render-transformer';

describe('resultsAnswerRenderTransformer', () => {
  describe('empty readings', () => {
    it('VALID: {rows: []} => outputs instance header and none found notice', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\nREADINGS: none found for query\n');
    });
  });

  describe('step readings present', () => {
    it('VALID: {rows with step, verb, content} => outputs formatted readings', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({ step: 1, verb: 'goto', content: 'https://example.com' }),
          }),
          ContentTextStub({
            value: JSON.stringify({ step: 2, verb: 'click', content: '[data-testid="ADD"]' }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\n[step 1] goto: https://example.com\n[step 2] click: [data-testid="ADD"]\n',
      );
    });

    it('VALID: {rows with step, verb, reading} => formats using reading field', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({ step: 1, verb: 'goto', reading: 'navigated to /' }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\n[step 1] goto: navigated to /\n');
    });
  });

  describe('stored return present', () => {
    it('VALID: {storedReturn} => delegates to runAnswerRenderTransformer under instance header', () => {
      const runResult = RunResultStub({ shots: [] });
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'killed' }),
        rows: [],
        storedReturn: runResult,
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (killed)\nRUN: run_1 (status: done, steps: 5, duration: 0ms)\n',
      );
    });
  });
});
