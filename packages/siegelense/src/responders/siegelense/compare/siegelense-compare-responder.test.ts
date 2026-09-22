import { CompareAnswerStub } from '../../../contracts/compare-answer/compare-answer.stub';
import { CompareQueryStub } from '../../../contracts/compare-query/compare-query.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { RunMissingError } from '../../../errors/run-missing/run-missing-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { compareAnswerRenderTransformer } from '../../../transformers/compare-answer-render/compare-answer-render-transformer';

import { SiegelenseCompareResponder } from './siegelense-compare-responder';
import { SiegelenseCompareResponderProxy } from './siegelense-compare-responder.proxy';

describe('SiegelenseCompareResponder', () => {
  describe('two runs', () => {
    it('VALID: {default: isJson false} => writes the human summary to stdout', async () => {
      const proxy = SiegelenseCompareResponderProxy();
      const query = CompareQueryStub();
      const answer = CompareAnswerStub({
        instanceId: query.instanceId,
        runA: query.runA,
        runB: query.runB,
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCompareResponder({ query });

      expect(proxy.getStdoutWrites()).toStrictEqual([compareAnswerRenderTransformer({ answer })]);
    });

    it('VALID: {isJson: true} => writes the complete CompareAnswer as one JSON document', async () => {
      const proxy = SiegelenseCompareResponderProxy();
      const query = CompareQueryStub();
      const answer = CompareAnswerStub({
        instanceId: query.instanceId,
        runA: query.runA,
        runB: query.runB,
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCompareResponder({ query, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('an unknown instance', () => {
    it('ERROR: {an unknown instance} => InstanceUnknownError propagates and stdout stays empty', async () => {
      const proxy = SiegelenseCompareResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const query = CompareQueryStub({ instanceId });
      const error = new InstanceUnknownError({ instanceId });
      proxy.stageError({ error });

      await expect(SiegelenseCompareResponder({ query })).rejects.toStrictEqual(error);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });

  describe('a run with no stored return', () => {
    it('ERROR: {a run with no stored return} => RunMissingError propagates and stdout stays empty', async () => {
      const proxy = SiegelenseCompareResponderProxy();
      const instanceId = InstanceIdStub();
      const runB = RunIdStub({ value: 'run_9' });
      const query = CompareQueryStub({ instanceId, runB });
      const error = new RunMissingError({ instanceId, runId: runB });
      proxy.stageError({ error });

      await expect(SiegelenseCompareResponder({ query })).rejects.toThrow(
        new RegExp(
          `^No stored return for run "run_9" on instance "${instanceId}" — that run never completed, or its evidence was pruned\\.$`,
          'u',
        ),
      );
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
