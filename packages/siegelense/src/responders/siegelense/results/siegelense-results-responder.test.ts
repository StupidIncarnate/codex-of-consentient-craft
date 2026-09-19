import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { ResultsAnswerStub } from '../../../contracts/results-answer/results-answer.stub';
import { ResultsQueryStub } from '../../../contracts/results-query/results-query.stub';
import { RunIdRequiredError } from '../../../errors/run-id-required/run-id-required-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { resultsAnswerRenderTransformer } from '../../../transformers/results-answer-render/results-answer-render-transformer';

import { SiegelenseResultsResponder } from './siegelense-results-responder';
import { SiegelenseResultsResponderProxy } from './siegelense-results-responder.proxy';

describe('SiegelenseResultsResponder', () => {
  describe('a run named', () => {
    it('VALID: {a run named} => writes the concise human view by default', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub({ runId: RunIdStub({ value: 'run_2' }) });
      const answer = ResultsAnswerStub({ instanceId: query.instanceId, runId: query.runId });
      proxy.stageAnswer({ answer });

      await SiegelenseResultsResponder({ query });

      expect(proxy.getStdoutWrites()).toStrictEqual([resultsAnswerRenderTransformer({ answer })]);
    });

    it('VALID: {json: true} => writes the complete ResultsAnswer as raw JSON', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub({ runId: RunIdStub({ value: 'run_2' }) });
      const answer = ResultsAnswerStub({ instanceId: query.instanceId, runId: query.runId });
      proxy.stageAnswer({ answer });

      await SiegelenseResultsResponder({ query, json: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('an unknown instance id', () => {
    it("VALID: {an unknown instance id} => writes instanceState 'unknown' and returns rather than throws", async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub();
      const answer = ResultsAnswerStub({
        instanceId: query.instanceId,
        instanceState: 'unknown',
        rows: [],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseResultsResponder({ query, json: true });

      expect(proxy.getWrittenAnswer()).toStrictEqual(answer);
    });
  });

  describe('a finished instance with no run and no since', () => {
    it('ERROR: {a finished instance with no run and no since} => RunIdRequiredError propagates and stdout stays empty', async () => {
      const proxy = SiegelenseResultsResponderProxy();
      const query = ResultsQueryStub();
      const error = new RunIdRequiredError({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        runCount: 2,
      });
      proxy.stageError({ error });

      await expect(SiegelenseResultsResponder({ query })).rejects.toStrictEqual(error);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
